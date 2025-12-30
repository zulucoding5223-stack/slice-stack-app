import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({
        succcess: false,
        message: "No access token",
      });
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_JWT_TOKEN);

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired.",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid access token",
    });
  }
};
