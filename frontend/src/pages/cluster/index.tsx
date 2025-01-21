import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";

interface ElasticClusterDetails {
  clusterName: string;
  clusterUUID: string;
  status: string;
  version: string;
  timedOut: boolean;
  numberOfDataNodes: number;
  numberOfNodes: number;
  activePrimaryShards: number;
  activeShards: number;
  unassignedShards: number;
  initializingShards: number;
  relocatingShards: number;
}

const ClusterOverview = () => {
  const [clusterDetails, setClusterDetails] = useState<ElasticClusterDetails>();
  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "green":
        return "text-green-500";
      case "yellow":
        return "text-yellow-500";
      case "red":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };
  const getClusterDetails = async () => {
    const data: ElasticClusterDetails = await axiosInstance.post(
      "/api/elastic/cluster",
      {
        url: "https:localhost:9200",
        username: "elastic",
        password: "upgrade",
      }
    );
    console.log(data);
    setClusterDetails(data);
    return data;
  };
  useEffect(() => {
    getClusterDetails();
  }, []);

  return (
    <div className="w-full rounded-sm shadow-md">
      <div>
        {/* <div>
          <p>Details</p>
        </div>
        <div>
          <button>Upgrade available</button>
        </div> */}
      </div>
      <div className="grid grid-cols-2 gap-y-10 mb-8 w-full ">
        <div>
          <div className="text-sm mb-1">Cluster name</div>
          <div className="text-gray-400">{clusterDetails?.clusterName}</div>
        </div>

        <div>
          <div className="text-sm mb-1">Cluster status</div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(
                clusterDetails?.status
              )}`}
            />
            <span className="capitalize">{clusterDetails?.status}</span>
          </div>
        </div>

        <div>
          <div className="text-sm mb-1">Cluster UUID</div>
          <div className="text-gray-400">{clusterDetails?.clusterUUID}</div>
        </div>

        <div>
          <div className="text-sm mb-1">ES Version</div>
          <div className="text-gray-400">{clusterDetails?.version}</div>
        </div>

        <div>
          <div className="text-sm mb-1">Infrastructure type</div>
          <div className="text-gray-400">{}</div>
        </div>

        <div>
          <div className="text-sm mb-1">Timed out</div>
          <div className="text-gray-400">
            {clusterDetails?.timedOut.toString()}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 mb-10" style={{background: "#161616"}}>
        <div className="mb-2">
          <p>Number of data nodes</p>
          <div>{clusterDetails?.numberOfDataNodes}</div>
        </div>
        <div>
          <p>Number of nodes</p>
          <div>{clusterDetails?.numberOfNodes}</div>
        </div>
        <div>
          <p>Active Primary Shards</p>
          <div>{clusterDetails?.activePrimaryShards}</div>
        </div>
        <div>
          <p>Relocating Shards</p>
          <div>{clusterDetails?.relocatingShards}</div>
        </div>
        <div>
          <p>Initializing Shards</p>
          <div>{clusterDetails?.initializingShards}</div>
        </div>
        <div>
          <p>Unassigned Shards</p>
          <div>{clusterDetails?.unassignedShards}</div>
        </div>
      </div>
    </div>

    // <div className = "">
    //   <div className="mb-6">
    //     <h2 className="text-lg font-semibold">Cluster Overview</h2>
    //   </div>
    //   <div className="mb-4">
    //     <p className="flex justify-between">
    //       <span>Cluster name</span>
    //       <span className="font-medium">{clusterDetails?.clusterName}</span>
    //     </p>
    //     <p className="flex justify-between">
    //       <span>Cluster UUID</span>
    //       <span className="font-medium text-gray-400">{clusterDetails?.clusterUUID}</span>
    //     </p>
    //     <p className="flex justify-between">
    //       <span>Cluster status</span>
    //       <span className={`font-medium ${getStatusColor(clusterDetails?.status)}`}>
    //         {clusterDetails?.status}
    //       </span>
    //     </p>
    //     <p className="flex justify-between">
    //       <span>ES Version</span>
    //       <span className="font-medium">{clusterDetails?.version}</span>
    //     </p>
    //     <p className="flex justify-between">
    //       <span>Timed out</span>
    //       <span className="font-medium">
    //         {clusterDetails?.timedOut ? "True" : "False"}
    //       </span>
    //     </p>
    //   </div>
    //   <div>
    //     <p className="mb-2">Infrastructure Type</p>
    //     <div className="grid grid-cols-2 gap-4 text-sm">
    //       <div className="flex justify-between">
    //         <span>Number of data nodes</span>
    //         <span>{clusterDetails?.numberOfDataNodes}</span>
    //       </div>
    //       <div className="flex justify-between">
    //         <span>Number of nodes</span>
    //         <span>{clusterDetails?.numberOfNodes}</span>
    //       </div>
    //       <div className="flex justify-between">
    //         <span>Active primary shards</span>
    //         <span>{clusterDetails?.activePrimaryShards}</span>
    //       </div>
    //       <div className="flex justify-between">
    //         <span>Active shards</span>
    //         <span>{clusterDetails?.activeShards}</span>
    //       </div>
    //       <div className="flex justify-between">
    //         <span>Unassigned shards</span>
    //         <span>{clusterDetails?.unassignedShards}</span>
    //       </div>
    //       <div className="flex justify-between">
    //         <span>Initializing shards</span>
    //         <span>{clusterDetails?.initializingShards}</span>
    //       </div>
    //       <div className="flex justify-between">
    //         <span>Relocating shards</span>
    //         <span>{clusterDetails?.relocatingShards}</span>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
};

export default ClusterOverview;
