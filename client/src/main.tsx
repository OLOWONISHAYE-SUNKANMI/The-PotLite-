import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "The Pot - Group Savings App";

createRoot(document.getElementById("root")!).render(<App />);
