"use client";
import { usePathname } from "next/navigation";
import UsageTelemetry from "./UsageTelemetry";
export default function AppUsageTelemetry() { return <UsageTelemetry pathname={usePathname()} />; }
