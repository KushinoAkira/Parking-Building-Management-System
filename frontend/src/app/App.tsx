import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./components/ThemeProvider";
import { LocaleProvider } from "./lib/i18n/LocaleContext";
import { RealtimeProvider } from "./lib/RealtimeContext";

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <RealtimeProvider>
          <RouterProvider router={router} />
        </RealtimeProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
