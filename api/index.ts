export default async (req: any, res: any) => {
    // Dynamic import to avoid build-time resolution error of missing artifact
    // dist-server/index.js is created during build
    const app = (await import("../dist-server/index.js")).default;
    app(req, res);
};
