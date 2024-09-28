import React, { useState } from "react";
import { navigate } from "gatsby";
import { signUp, signIn, addUser } from "../utils/firebase";

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        try {
            if (isLogin) {
                await signIn(name, password);
                navigate("/");
            } else {
                const userId = await signUp(email, password);
                if (userId) {
                    await addUser({ name, email }, userId);
                    setIsLogin(true);
                    setName("");
                    setEmail("");
                    setPassword("");
                    setSuccessMessage("Account created successfully. Please log in.");
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
                if (error.message.includes('ad blockers')) {
                    setError("Sign-in failed due to browser security settings. Please try disabling ad blockers or security extensions and try again.");
                }
            } else {
                setError("An unknown error occurred");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isLogin ? "Sign in to your account" : "Create a new account"}
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                {isLogin ? "Email or Username" : "Email"}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type={isLogin ? "text" : "email"}
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={isLogin ? name : email}
                                    onChange={(e) => isLogin ? setName(e.target.value) : setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm">{error}</div>
                        )}
                        {successMessage && (
                            <div className="text-green-600 text-sm">{successMessage}</div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {isLogin ? "Sign in" : "Sign up"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
                        >
                            {isLogin ? "Create a new account" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;