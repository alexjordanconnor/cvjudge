"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="card w-full max-w-md rounded-xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Judge.run</h1>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded bg-zinc-900 px-3 py-2" placeholder="Your Name" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded bg-zinc-900 px-3 py-2" placeholder="Password" />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button
            className="w-full rounded bg-indigo-500 px-3 py-2 font-medium"
            onClick={() => {
              if (password !== "CVest2022!") return setError("Incorrect password");
              if (!name.trim()) return setError("Please enter your name");
              localStorage.setItem("judge_operator", JSON.stringify({ name: name.trim() }));
              router.push("/events");
            }}
          >
            Enter
          </button>
        </div>
      </div>
    </main>
  );
}
