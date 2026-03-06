import { motion, AnimatePresence } from "framer-motion";

const LoadingScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-suraksh-navy"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative w-24 h-24">
        {/* Assembling triangle fragments */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,10 25,55 50,45"
            fill="hsl(210, 100%, 50%)"
            className="animate-assemble-1"
          />
          <polygon
            points="50,10 75,55 50,45"
            fill="hsl(175, 70%, 40%)"
            className="animate-assemble-2"
          />
          <polygon
            points="25,55 75,55 50,90"
            fill="hsl(215, 20%, 35%)"
            className="animate-assemble-3"
          />
        </svg>
        {/* Outer triangle outline */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
        >
          <polygon
            points="50,8 20,58 80,58"
            fill="none"
            stroke="hsl(210, 100%, 60%)"
            strokeWidth="1"
            className="animate-triangle-draw"
          />
        </svg>
      </div>
      <motion.p
        className="mt-6 text-sm font-display tracking-[0.3em] uppercase text-suraksh-glow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Suraksh
      </motion.p>
    </motion.div>
  );
};

export default LoadingScreen;
