import jwt from "jsonwebtoken";
export const generateAccessToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.ACCESS_JWT_TOKEN, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.REFRESH_JWT_TOKEN, {
    expiresIn: "7d",
  });
};
