import axios from "axios";
import { API_URL, authHeaders, getStoredUser, updateStoredUser } from "./auth";

const LAST_PAYMENT_STORAGE_KEY = "preptube:last-payment";

function getRazorpayConstructor() {
  if (typeof window !== "undefined" && typeof window.Razorpay === "function") {
    return window.Razorpay;
  }

  throw new Error("Razorpay checkout script is not available. Refresh the page and try again.");
}

function saveLastPayment(payment) {
  if (typeof window === "undefined" || !payment) return;
  window.sessionStorage.setItem(LAST_PAYMENT_STORAGE_KEY, JSON.stringify(payment));
}

export function getLastPayment() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.sessionStorage.getItem(LAST_PAYMENT_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export async function handlePayment() {
  const user = getStoredUser();
  const Razorpay = getRazorpayConstructor();
  let orderPayload;

  try {
    const response = await axios.post(`${API_URL}/payment/create-order`, {}, { headers: authHeaders() });
    orderPayload = response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Unable to create the Razorpay order.");
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const checkout = new Razorpay({
      key: orderPayload.keyId,
      amount: orderPayload.order.amount,
      currency: orderPayload.order.currency,
      name: "PrepTube",
      description: orderPayload.plan?.name || "PrepTube Premium Monthly",
      order_id: orderPayload.order.id,
      prefill: {
        name: user?.name || user?.username || "",
        email: user?.email || "",
      },
      notes: {
        planId: orderPayload.plan?.id || "premium-monthly",
      },
      theme: {
        color: "#f97316",
      },
      modal: {
        ondismiss: () => {
          if (settled) return;
          settled = true;
          reject(new Error("Payment was cancelled before completion."));
        },
      },
      handler: async (response) => {
        if (settled) return;

        try {
          const { data } = await axios.post(`${API_URL}/payment/verify`, {
            orderId: orderPayload.order.id,
            ...response,
          }, { headers: authHeaders() });

          settled = true;
          saveLastPayment(data.payment);
          if (data.user) {
            updateStoredUser(data.user);
          }
          resolve(data);
        } catch (error) {
          settled = true;
          reject(new Error(error.response?.data?.message || "Payment verification failed."));
        }
      },
    });

    checkout.on("payment.failed", (event) => {
      if (settled) return;
      settled = true;
      reject(new Error(event.error?.description || "Payment failed. Please try again."));
    });

    try {
      checkout.open();
    } catch (error) {
      settled = true;
      reject(new Error(error.message || "Unable to open Razorpay checkout."));
    }
  });
}
