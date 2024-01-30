"use client";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { SetStateAction, useState } from "react";

// import * as commands from "@uiw/react-md-editor/commands";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

function PostEditor() {
  const [value, setValue] = useState("**Hello world!!!**");
  console.log(value);
  return (
    <div data-color-mode="dart">
      <div className="wmde-markdown-var"> </div>

      <MDEditor
        value={value}
        onChange={(value: string | undefined) => setValue(value || "")}
      />
    </div>
  );
}

export default PostEditor;
