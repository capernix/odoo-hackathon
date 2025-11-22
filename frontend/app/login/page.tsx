"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);


const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);


try {
// TODO: replace with real auth call
await new Promise((r) => setTimeout(r, 700));
// on success:
router.push("/dashboard");
} catch (err) {
console.error(err);
alert("Login failed — check console for details.");
} finally {
setLoading(false);
}
};


return (
<div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
<div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
<h2 className="text-2xl font-bold mb-4 text-gray-900">Login</h2>


<form onSubmit={handleSubmit} className="flex flex-col gap-4">
<input
value={email}
onChange={(e) => setEmail(e.target.value)}
type="email"
placeholder="Email"
required
className="w-full p-3 border border-gray-300 rounded-lg text-black"
/>


<input
value={password}
onChange={(e) => setPassword(e.target.value)}
type="password"
placeholder="Password"
required
className="w-full p-3 border border-gray-300 rounded-lg text-black"
/>

<div className="mt-2 text-right">
  <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
    Forgot Password?
  </a>
</div>



<button
type="submit"
className="w-full bg-black text-white py-3 rounded-xl mt-2 hover:bg-gray-800 disabled:opacity-60"
disabled={loading}
>
{loading ? "Logging in..." : "Login"}
</button>
</form>


<p className="text-sm text-center text-gray-600 mt-4">
Don’t have an account?{' '}
<Link href="/signup" className="text-blue-600 underline">
Create Account
</Link>
</p>
</div>
</div>
);
}