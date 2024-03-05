import React from "react";
import { CardHoverEffect } from "./allCard";

const AllProjects = ({ data2 }) => {
  // console.log(data2);
  return (
    <div>
      <CardHoverEffect data2={data2} />
    </div>
  );
};

export default AllProjects;
