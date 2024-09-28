import "./src/styles/global.css"
import { initFirebase } from "./src/utils/firebase-config"

export const onClientEntry = () => {
    initFirebase();
};