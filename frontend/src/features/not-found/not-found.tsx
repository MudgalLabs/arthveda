import { Link } from "react-router-dom";

export const NotFound = () => {
    return (
        <main className="grid h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
            <div className="text-center">
                <p className="text-secondary-600 text-7xl font-bold tracking-wider md:text-8xl lg:text-9xl">
                    404
                </p>
                <h1 className="text-primary-300 mt-2 text-4xl font-bold tracking-wider md:text-5xl lg:text-6xl">
                    Page not found
                </h1>
                <p className="text-primary-300 my-12 text-lg md:text-xl lg:text-2xl">
                    You are lost. Go back where you came from.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link to="/" className="text-sm font-semibold">
                        &larr; Go back home
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default NotFound;
