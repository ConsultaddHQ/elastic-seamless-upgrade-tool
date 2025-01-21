import React, { useEffect } from 'react'
import { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';

export interface ElasticNode {
    id: string;
    name: string;
    version: string;
    ip: string;
    roles: Array<any>;
    os: Object;
}
const NodeInfo = ()=> {
    
  const [nodes,setNodes] = useState<ElasticNode[]>([])
  const getNodeData = async()=>{
    const data: ElasticNode[] = await axiosInstance.post('/api/elastic/nodes',
        {
            url: "https:localhost:9200",
            username: "elastic",
            password: "upgrade"
        
        }
    )
    console.log(data);
    setNodes(data);
  }
  useEffect(()=>{
    getNodeData();
  },[])

  const getHighestPriorityRole = (roles: string[])=>{
    const rolePriority = ['master', 'master_eligible', 'data', 'ml'];
    for (const role of rolePriority) {
        if (roles.includes(role)) {
            return role;
        }
      }
      return ""
  }

//   const nodes: any= [
//     {
//       id: "1",
//       name: "Node-A",
//       version: "7.10.2",
//       ip: "192.168.0.1",
//       roles: "master, data",
//       os: "Linux",
//     },
//     {
//       id: "2",
//       name: "Node-B",
//       version: "7.11.0",
//       ip: "192.168.0.2",
//       roles: "data",
//       os: "Windows",
//     },
//     {
//       id: "3",
//       name: "Node-C",
//       version: "7.12.1",
//       ip: "192.168.0.3",
//       roles: "ingest, data",
//       os: "MacOS",
//     },
//   ];
  return (
    <div>
    <div className="relative overflow-x-auto border-shine shadow sm:rounded-lg ">
      <div className="flex items-center justify-between flex-wrap space-y-4 md:space-y-0 pb-4">
        <div>
            Node details
        </div>
        <div>
            <button >Upgrade All</button>
        </div>
      </div>
      <table className="w-5/6 text-sm text-left text-gray-500 dark:text-gray-400">
        <thead style = {{background: "#161616"}} className="text-xs uppercase  text-customPurple font-sans rounded-md">
          <tr>
            <th scope="col" className="px-6 py-3 ">
              Node Name
            </th>
            
            <th scope="col" className="px-6 py-3">
              Role
            </th>
            <th scope="col" className="px-6 py-3">
              OS
            </th>
            <th scope="col" className="px-6 py-3">
                version
            </th>

            <th scope='col' className='px-6 py-3'>
                action
            </th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node: any) => (
            <tr
              key={node.id}
              className= " dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-600"
              style={{
                border: "1px"
              }}
            >
              
              <td className='px-6 py-4 text-white'>{node.name}</td>
              <td className="px-6 py-4 text-wh">{getHighestPriorityRole(node.roles)}</td>
              <td className="px-6 py-4">{node.os.name}</td>
              <td className='px-6 py-4' >{node.version}</td>
              <td className="px-6 py-4">
                <button>
                    upgrade
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default NodeInfo