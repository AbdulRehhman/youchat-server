import User from "../models/UserModel.js";
import  jwt from "jsonwebtoken";

const tokenLife = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({email, userId}, process.env.JWT_SECRET, {expiresIN: tokenLife});
}

export const signup = async (request, response, next) => {
  try {
    const {email, passsword} = request.body;
    if(!email || !passsword) {
      return response.status(400).send("Email and password are required");
    }

    const user = await User.create(email, password);
    response.cookie("jwt", createToken(email, user.id), {
      secure: true,
      sameSite: "none",
      maxAge: tokenLife,
    });

    return response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
        profileSetup: user.profileSetup,
      }
    });
  } catch(error) {
    console.log(error);
    return response.status(500).send("Internal server error");
  }
};