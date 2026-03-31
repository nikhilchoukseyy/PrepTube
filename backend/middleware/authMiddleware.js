import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { buildAvatarUrl, generateUniqueUsername } from "../utils/userIdentity.js";

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      let didMutate = false;
      if (!user.username) {
        user.username = await generateUniqueUsername(user, user._id);
        didMutate = true;
      }
      if (!user.avatar) {
        user.avatar = buildAvatarUrl(user.username || user.name || user.email);
        didMutate = true;
      }
      const hasPremiumFlag = user.isPremium === true || user.plan === "premium";
      if (hasPremiumFlag) {
        const premiumExpiresAt = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
        const premiumStillActive =
          premiumExpiresAt &&
          !Number.isNaN(premiumExpiresAt.getTime()) &&
          premiumExpiresAt.getTime() > Date.now();

        if (!premiumStillActive) {
          user.isPremium = false;
          user.plan = "free";
          user.premiumExpiresAt = null;
          didMutate = true;
        }
      }
      if (didMutate) {
        await user.save();
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

export { protect };
