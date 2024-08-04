import { compare } from "bcrypt";
import User from "../models/UserModel.js";
import  jwt from "jsonwebtoken";

const tokenLife = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({email, userId}, process.env.JWT_KEY, {expiresIn: tokenLife});
}

export const signup = async (request, response, next) => {
  try {
    const {email, password} = request.body;
    if(!email || !password) {
      return response.status(400).send("Email and password are required");
    }
    console.log(email, password);

    const user = await User.create({email, password});
    response.cookie("jwt", createToken(email, user.id), {
      secure: true,
      sameSite: "none",
      maxAge: tokenLife,
    });

    return response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
      }
    });
  } catch(error) {
    console.log(error);
    return response.status(500).send("Internal server error");
  }
};

export const login = async (request, response, next) => {
  try {
    const {email, password} = request.body;
    if(!email || !password) {
      return response.status(400).send("Email and password are required");
    }
    console.log(email, password);

    const user = await User.findOne({ email });
    if(!user) {
      return response.status(404).send("User not found");
    }
    const auth = await compare(password, user.password);
    if(!auth) {
      return response.status(401).send("Invalid credentials");
    }

    response.cookie("jwt", createToken(email, user.id), {
      secure: true,
      sameSite: "none",
      maxAge: tokenLife,
    });

    return response.status(200).json({
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