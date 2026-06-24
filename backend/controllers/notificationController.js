import Notification from "../models/Notification.js";

// GET ALL NOTIFICATIONS FOR LOGGED-IN USER
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MARK SINGLE NOTIFICATION AS READ
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found or access denied." });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MARK ALL UNREAD NOTIFICATIONS FOR USER AS READ
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE SINGLE NOTIFICATION
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found or access denied." });
    }

    res.status(200).json({ message: "Notification deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
