import "./src/styles/global.css"
import { getFirebase } from "./src/utils/firebase-config"

export const onClientEntry = () => {
    const app = getFirebase();
};