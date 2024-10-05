import { useState, useEffect } from "react";
import  SystemStatusDashboard  from '@/components/system-status-dashboard';
import React from 'react';

const Db_live = () => {
     const [isClient, setIsClient] = useState(false);

     useEffect(() => {
       setIsClient(true);
     }, []);
    return <div>{isClient ? <SystemStatusDashboard /> : "loading.."}</div>;
};



export default Db_live;