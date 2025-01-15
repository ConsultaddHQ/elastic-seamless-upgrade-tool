import React, { useEffect , useState} from "react";
import axiosInstance from "../../utils/axiosConfig";

interface ElasticClusterDetails {
  clusterName: string;
  clusterUUID: string;
  clusterStatus: string;
  esVersion: string;
  timedOut: boolean;
  numberOfDataNodes: number;
  numberOfNodes: number;
  activePrimaryShards: number;
  activeShards: number;
  unassignedShards: number;
  initializingShards: number;
  relocatingShards: number;
}

const ClusterOverview= () => {

  const [clusterDetails,setClusterDetails] = useState<ElasticClusterDetails>();
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
  const getClusterDetails = async()=>{
    const data: ElasticClusterDetails = await axiosInstance.post('/api/elastic/cluster',{
        url: "https:localhost:9200",
        username: "elastic",
        password: "upgrade"
    })
    console.log(data);
    setClusterDetails(data);
    return data;
  }
  useEffect(()=>{
    getClusterDetails();
  },[])



  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-md max-w-lg">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Elastic Overview</h2>
      </div>
      <div className="mb-4">
        <p className="flex justify-between">
          <span>Cluster name</span>
          <span className="font-medium">{clusterDetails?.clusterName}</span>
        </p>
        <p className="flex justify-between">
          <span>Cluster UUID</span>
          <span className="font-medium text-gray-400">{clusterDetails?.clusterUUID}</span>
        </p>
        <p className="flex justify-between">
          <span>Cluster status</span>
          <span className={`font-medium ${getStatusColor(clusterDetails?.clusterStatus)}`}>
            {clusterDetails?.clusterStatus}
          </span>
        </p>
        <p className="flex justify-between">
          <span>ES Version</span>
          <span className="font-medium">{clusterDetails?.esVersion}</span>
        </p>
        <p className="flex justify-between">
          <span>Timed out</span>
          <span className="font-medium">
            {clusterDetails?.timedOut ? "True" : "False"}
          </span>
        </p>
      </div>
      <div>
        <p className="mb-2">Infrastructure Type</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Number of data nodes</span>
            <span>{clusterDetails?.numberOfDataNodes}</span>
          </div>
          <div className="flex justify-between">
            <span>Number of nodes</span>
            <span>{clusterDetails?.numberOfNodes}</span>
          </div>
          <div className="flex justify-between">
            <span>Active primary shards</span>
            <span>{clusterDetails?.activePrimaryShards}</span>
          </div>
          <div className="flex justify-between">
            <span>Active shards</span>
            <span>{clusterDetails?.activeShards}</span>
          </div>
          <div className="flex justify-between">
            <span>Unassigned shards</span>
            <span>{clusterDetails?.unassignedShards}</span>
          </div>
          <div className="flex justify-between">
            <span>Initializing shards</span>
            <span>{clusterDetails?.initializingShards}</span>
          </div>
          <div className="flex justify-between">
            <span>Relocating shards</span>
            <span>{clusterDetails?.relocatingShards}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterOverview;
