import { motion } from "framer-motion";

export default function Loader({ text = "Loading your workspace..." }) {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#120000] to-black text-white">

      {/* Loader */}
      <div className="relative flex items-center justify-center">

        {/* Rotating Ring */}
        <motion.div
          className="w-20 h-20 rounded-full"
          style={{
            background: "conic-gradient(#ff3c00, #ff7a00, #ff3c00)",
            WebkitMask: "radial-gradient(circle, transparent 55%, black 56%)",
            mask: "radial-gradient(circle, transparent 55%, black 56%)",
            boxShadow: "0 0 25px rgba(255, 60, 0, 0.6)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1.4,
            ease: "linear",
          }}
        />

        {/* Pulsing Dot */}
        <motion.div
          className="absolute w-4 h-4 rounded-full"
          style={{
            background: "linear-gradient(45deg, #ff3c00, #ff7a00)",
            boxShadow: "0 0 15px rgba(255, 80, 0, 0.9)",
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Text */}
      <motion.p
        className="mt-6 text-sm text-gray-400 tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.6,
        }}
      >
        {text}
      </motion.p>

      {/* Subtle Glow Background Effect */}
      <div className="absolute w-72 h-72 bg-red-500/10 blur-3xl rounded-full"></div>
    </div>
  );
}