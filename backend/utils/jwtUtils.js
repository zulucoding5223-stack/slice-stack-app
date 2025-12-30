import jwt from "jsonwebtoken";
export const generateAccessToken = (user) => {
  const userId = user._id || user.id;
  return jwt.sign(
    { id: userId, role: user.role },
    process.env.ACCESS_JWT_TOKEN,
    {
      expiresIn: "15m",
    }
  );
};

export const generateRefreshToken = (user) => {
  const userId = user._id || user.id;
  return jwt.sign(
    { id: userId, role: user.role },
    process.env.REFRESH_JWT_TOKEN,
    {
      expiresIn: "7d",
    }
  );
};
