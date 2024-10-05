"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {databaseRunner} from '@/utils/markdown/databaseRunner.mjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SystemData {
  autoDeploy: string;
  branch: string;
  createdAt: string;
  dashboardUrl: string;
  id: string;
  name: string;
  notifyOnFail: string;
  ownerId: string;
  repo: string;
  rootDir: string;
  serviceDetails: {
    buildPlan: string;
    env: string;
    envSpecificDetails: {
      buildCommand: string;
      startCommand: string;
    };
    healthCheckPath: string;
    maintenanceMode: { enabled: boolean; uri: string };
    numInstances: number;
    openPorts: null;
    plan: string;
    previews: { generation: string };
    pullRequestPreviewsEnabled: string;
    region: string;
    runtime: string;
    sshAddress: string;
    url: string;
  };
  slug: string;
  suspended: string;
  suspenders: string[];
  type: string;
  updatedAt: string;
}

export default function SystemStatusDashboard() {
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const secret = process.env.RENDER_SECRET;

  useEffect(() => {
    // Fetch system data from API on every page load
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://api.render.com/v1/services/srv-cn9eli6n7f5s73fmp04g",
          {
            headers: {
              accept: "application/json",
              authorization: `Bearer ${secret}`,
            },
          },
        );
    const info = databaseRunner()
    setSystemData(info as any)
    console.log("info", info)
        setSystemData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching system data:", error);
        setIsLoading(false);
      }
    };

    fetchData(); // Call fetchData function
    console.log("systemData", systemData);
  }, []); // Empty dependency array ensures this runs on every refresh

  const suspendSystem = async () => {
    try {
      const response = await axios.post(
        "https://api.render.com/v1/services/srv-cn9eli6n7f5s73fmp04g/suspend",
        {},
        {
          headers: {
            accept: "application/json",
            authorization: `Bearer ${secret}`,
          },
        },
      );
      console.log(response.data);
      // Update system data after suspension
      if (systemData) {
        setSystemData({
          ...systemData,
          suspended: "suspended",
          suspenders: ["user"],
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resumeSystem = async () => {
    try {
      const response = await axios.post(
        "https://api.render.com/v1/services/srv-cn9eli6n7f5s73fmp04g/resume",
        {},
        {
          headers: {
            accept: "application/json",
            authorization: `Bearer ${secret}`,
          },
        },
      );
      console.log(response.data);
      // Update system data after resuming
      if (systemData) {
        setSystemData({
          ...systemData,
          suspended: "not_suspended",
          suspenders: [],
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const goBack = () => {
    window.history.back(); // Go back to the previous page
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!systemData) {
    return <div>No system data available</div>;
  }

  const isLive = systemData.suspended === "not_suspended";

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>System Status Dashboard</CardTitle>
          <CardDescription>Monitor and control system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              <Badge variant={isLive ? "default" : "destructive"}>
                {isLive ? "Live" : "Suspended"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Name</p>
                <p>{systemData.name}</p>
              </div>
              <div>
                <p className="font-medium">ID</p>
                <p>{systemData.id}</p>
              </div>
              <div>
                <p className="font-medium">Branch</p>
                <p>{systemData.branch}</p>
              </div>
              <div>
                <p className="font-medium">Auto Deploy</p>
                <p>{systemData.autoDeploy}</p>
              </div>
              <div>
                <p className="font-medium">Region</p>
                <p>{systemData.serviceDetails.region}</p>
              </div>
              <div>
                <p className="font-medium">Plan</p>
                <p>{systemData.serviceDetails.plan}</p>
              </div>
              <div>
                <p className="font-medium">Build Command</p>
                <p>
                  {systemData.serviceDetails.envSpecificDetails.buildCommand}
                </p>
              </div>
              <div>
                <p className="font-medium">Start Command</p>
                <p>
                  {systemData.serviceDetails.envSpecificDetails.startCommand}
                </p>
              </div>
            </div>
            {isLive && (
              <div>
                <p className="font-medium">Service URL</p>
                <a
                  href={systemData.serviceDetails.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {systemData.serviceDetails.url}
                </a>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Last updated: {new Date(systemData.updatedAt).toLocaleString()}
          </p>
          <div className="space-x-2">
            {isLive ? (
              <Button variant="destructive" onClick={suspendSystem}>
                <Power className="mr-2 h-4 w-4" /> Suspend System
              </Button>
            ) : (
              <Button variant="default" onClick={resumeSystem}>
                <Power className="mr-2 h-4 w-4" /> Resume System
              </Button>
            )}
            <Button variant="secondary" onClick={goBack}>
              Go Back
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
