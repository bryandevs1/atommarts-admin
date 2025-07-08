import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function UserMetaCard() {
  const { user } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const token = useAuth();

  const handleSave = async () => {
    setErrors({});

    // Validate inputs
    const validationErrors = {};
    if (!currentPassword)
      validationErrors.currentPassword = "Current password is required";
    if (!newPassword) validationErrors.newPassword = "New password is required";
    if (newPassword.length < 8)
      validationErrors.newPassword = "Password must be at least 8 characters";
    if (newPassword !== confirmPassword)
      validationErrors.confirmPassword = "Passwords don't match";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    console.log("Changing password...");
    console.log("Token:", token);
    try {
      const response = await axios.post(
        "https://nexodus.tech/api/auth/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(response.data.message || "Password changed successfully");
      closeModal();
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      toast.error(errorMessage);

      // Handle specific backend errors
      if (error.response?.data?.code === "INVALID_CURRENT_PASSWORD") {
        setErrors({ currentPassword: "Current password is incorrect" });
      } else if (error.response?.data?.code === "SAME_PASSWORD") {
        setErrors({ newPassword: "New password must be different" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src="./images/logo/logo-icon.svg"
                className="text-center items-center"
                alt="user"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user?.firsName || "Admin"} {user?.lastName || " "}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={openModal}
            className="order-2 xl:order-3"
            variant="primary"
          >
            Change Password
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Change Password"
        className="max-w-[584px] p-5 lg:p-10"
      >
        <div className="space-y-4">
          {/* Current Password Field */}
          <div>
            {errors.currentPassword && (
              <p className="mb-1 text-sm text-red-500">
                {errors.currentPassword}
              </p>
            )}
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              hasError={!!errors.currentPassword}
            />
          </div>

          {/* New Password Field */}
          <div>
            {errors.newPassword && (
              <p className="mb-1 text-sm text-red-500">{errors.newPassword}</p>
            )}
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              hasError={!!errors.newPassword}
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            {errors.confirmPassword && (
              <p className="mb-1 text-sm text-red-500">
                {errors.confirmPassword}
              </p>
            )}
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              hasError={!!errors.confirmPassword}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
