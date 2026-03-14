import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page";
import { AppLayout } from "./pages/app-layout";
import { UploadPage } from "./pages/upload-page";
import { BillOverviewPage } from "./pages/bill-overview-page";
import { AnalysisPage } from "./pages/analysis-page";
import { BenchmarkingPage } from "./pages/benchmarking-page";
import { InsuranceInsightsPage } from "./pages/insurance-insights-page";
import { AppealPacketPage } from "./pages/appeal-packet-page";
import { CallAssistantPage } from "./pages/call-assistant-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: UploadPage },
      { path: "bill-overview", Component: BillOverviewPage },
      { path: "analysis", Component: AnalysisPage },
      { path: "benchmarking", Component: BenchmarkingPage },
      { path: "insurance-insights", Component: InsuranceInsightsPage },
      { path: "appeal-packet", Component: AppealPacketPage },
      { path: "call-assistant", Component: CallAssistantPage },
    ],
  },
]);