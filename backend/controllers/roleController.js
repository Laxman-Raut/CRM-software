import Role from "../models/Role.js";

// GET ALL ROLES
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE A CUSTOM ROLE
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Role name is required." });
    }

    const normalizedName = name.trim();

    // Check if role name already exists
    const roleExists = await Role.findOne({ name: { $regex: new RegExp(`^${normalizedName}$`, "i") } });
    if (roleExists) {
      return res.status(400).json({ message: "A role with this name already exists." });
    }

    const newRole = await Role.create({
      name: normalizedName,
      description: description || "",
      permissions: permissions || [],
      isSystem: false,
    });

    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE ROLE PERMISSIONS / NAME / DESCRIPTION
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    if (role.isSystem) {
      // The Admin role cannot be modified to prevent locked out state
      if (role.name.toLowerCase() === "admin") {
        return res.status(403).json({ message: "Access Denied: The system Admin role cannot be modified." });
      }
      
      role.description = description !== undefined ? description : role.description;
      role.permissions = permissions !== undefined ? permissions : role.permissions;
    } else {
      if (name) {
        const normalizedName = name.trim();
        const otherExists = await Role.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${normalizedName}$`, "i") }
        });
        if (otherExists) {
          return res.status(400).json({ message: "A role with this name already exists." });
        }
        role.name = normalizedName;
      }
      role.description = description !== undefined ? description : role.description;
      role.permissions = permissions !== undefined ? permissions : role.permissions;
    }

    await role.save();
    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE CUSTOM ROLE
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    if (role.isSystem) {
      return res.status(403).json({ message: "Access Denied: System roles cannot be deleted." });
    }

    await Role.findByIdAndDelete(id);
    res.status(200).json({ message: "Role deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
