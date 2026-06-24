import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { SearchProvider } from "./context/SearchContext";

function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <AppRoutes />
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;