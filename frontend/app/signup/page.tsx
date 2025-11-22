"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function SignupPage() {
const router = useRouter();
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);


const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);


try {
// TODO: replace with real signup call
await new Promise((r) => setTimeout(r, 800));
// on success, redirect to dashboard or login
router.push("/dashboard");
} catch (err) {
console.error(err);
alert("Signup failed — check console for details.");
} finally {
setLoading(false);
}
};
return (
<div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
<div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
<h2 className="text-2xl font-bold mb-4 text-gray-900">Create Account</h2>


<form onSubmit={handleSubmit} className="flex flex-col gap-4">
<input
value={name}
onChange={(e) => setName(e.target.value)}
type="text"
placeholder="Full name"
required
className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>


<input
value={email}
onChange={(e) => setEmail(e.target.value)}
type="email"
placeholder="Email"
required
className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>


<input
value={password}
onChange={(e) => setPassword(e.target.value)}
type="password"
placeholder="Password"
required
className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>


<button
type="submit"
className="w-full bg-blue-600 text-white py-3 rounded-lg mt-2 hover:bg-blue-700 disabled:opacity-60 font-medium transition"
disabled={loading}
>
{loading ? "Creating..." : "Create Account"}
</button>
</form>


<p className="text-sm text-center text-gray-600 mt-4">
Already have an account?{' '}
<Link href="/login" className="text-blue-600 underline">
Login
</Link>
</p>
</div>
</div>
);
}
