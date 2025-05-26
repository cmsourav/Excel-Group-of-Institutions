import { motion } from "framer-motion";

const directionVariants = {
    left: { initial: { x: -100, opacity: 0 }, exit: { x: 100, opacity: 0 } },
    right: { initial: { x: 100, opacity: 0 }, exit: { x: -100, opacity: 0 } },
    up: { initial: { y: -100, opacity: 0 }, exit: { y: 100, opacity: 0 } },
    down: { initial: { y: 100, opacity: 0 }, exit: { y: -100, opacity: 0 } },
};

const PageTransitionWrapper = ({ children, direction = "left" }) => {
    const { initial, exit } = directionVariants[direction] || directionVariants.left;

    return (
        <motion.div
            initial={initial}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={exit}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransitionWrapper;
