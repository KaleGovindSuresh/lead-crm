declare global {
  namespace Express {
    interface Request {
      user?: any; // replace with your user type
    }
  }
}