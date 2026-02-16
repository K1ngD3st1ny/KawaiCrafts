export default async (req: any, res: any) => {
    res.status(200).json({ message: "Deployment Unblocked Check", timestamp: Date.now() });
};
