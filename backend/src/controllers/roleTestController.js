export const adminOnlyTest = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin route accessed successfully.",
    loggedInUser: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

export const staffOrAdminTest = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Staff/Admin route accessed successfully.",
    loggedInUser: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

export const customerOnlyTest = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Customer route accessed successfully.",
    loggedInUser: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};