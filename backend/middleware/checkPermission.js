export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user session found" });
    }

    // Admins bypass all permission checks
    if (req.user.role && req.user.role.toLowerCase() === "admin") {
      return next();
    }

    if (req.user.resolvedPermissions && req.user.resolvedPermissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({
      message: `Access Denied: You do not have the required permission (${requiredPermission}).`
    });
  };
};
