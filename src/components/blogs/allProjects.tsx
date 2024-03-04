"use client";
import React from "react";
import { CardHoverEffect } from "./allCard";

const AllProjects = ({ data2 }: any) => {
  console.log(data2);
  return (
    <div>
      <CardHoverEffect />
    </div>
  );
};

export default AllProjects;
