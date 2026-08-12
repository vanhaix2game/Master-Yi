// Dynamic import cho route
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Dynamic import cho heavy library
const PDFViewer = lazy(() => import("./components/PDFViewer"));

// Tree-shaking friendly import
import { format } from "date-fns";

// CSS purging với Tailwind (mặc định)
