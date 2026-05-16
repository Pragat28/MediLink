const Doctor = require("../models/doctorModel");

/* =================================================
   GET LOGGED-IN DOCTOR PROFILE
   (AUTO CLEAN EXPIRED OVERRIDES)
================================================= */
exports.getDoctorProfile = async (req, res) => {
  try {

    let doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    /* -------- REMOVE EXPIRED SPECIAL AVAILABILITY -------- */

    const today = new Date();

    const validOverrides =
      doctor.availability?.overrides?.filter(
        (o) => new Date(o.to) >= today
      ) || [];

    if (doctor.availability) {
      doctor.availability.overrides = validOverrides;
      await doctor.save();
    }

    doctor = doctor.toObject();
    delete doctor.password;
    delete doctor.__v;

    res.json(doctor);

  } catch (error) {

    res.status(500).json({
      error: "Error fetching doctor profile",
      details: error.message
    });

  }
};



/* =================================================
   UPDATE DOCTOR PROFILE
================================================= */
exports.updateDoctorProfile = async (req, res) => {

  try {

    const updates = { ...req.body };

    /* ================= PHOTO UPLOAD ================= */

    if (req.file) {
      updates.photo = `/uploads/${req.file.filename}`;
    }

    /* ================= PROTECTED FIELDS ================= */

    delete updates.password;
    delete updates.role;
    delete updates.email;
    delete updates.rating;

    /* ================= GET EXISTING DOCTOR ================= */

    const existingDoctor = await Doctor.findById(req.user.id);

    if (!existingDoctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    /* ================= ADDRESS HANDLING ================= */

    if (updates.address) {

      updates.address = {
        street: updates.address.street ?? existingDoctor.address?.street ?? "",
        area: updates.address.area ?? existingDoctor.address?.area ?? "",
        city: updates.address.city ?? existingDoctor.address?.city ?? ""
      };

    }

    /* ================= AVAILABILITY HANDLING ================= */

    if (updates.availability) {

      const { weekly, overrides } = updates.availability;

      if (weekly) {

        const validDays = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday"
        ];

        Object.keys(weekly).forEach(day => {

          if (!validDays.includes(day)) {
            throw new Error(`Invalid weekday: ${day}`);
          }

          if (!Array.isArray(weekly[day])) {
            throw new Error(`${day} must be an array of slots`);
          }

          weekly[day].forEach((slot, index) => {

            if (!slot.start || !slot.end) {
              throw new Error(
                `Each slot in ${day} must contain start and end time`
              );
            }

            if (slot.start >= slot.end) {
              throw new Error(
                `Invalid slot timing in ${day} at index ${index}`
              );
            }

          });

        });

      }

      let cleanedOverrides = existingDoctor.availability?.overrides || [];

      if (overrides) {

        if (!Array.isArray(overrides)) {
          throw new Error("Overrides must be an array");
        }

        cleanedOverrides = overrides.map((override, index) => {

          if (!override.from || !override.to) {
            throw new Error(
              `Override at index ${index} must contain from and to dates`
            );
          }

          const fromDate = new Date(override.from);
          const toDate = new Date(override.to);

          if (fromDate > toDate) {
            throw new Error(
              `Override at index ${index} has invalid date range`
            );
          }

          if (!Array.isArray(override.slots)) {
            throw new Error(
              `Override at index ${index} must contain slots array`
            );
          }

          override.slots.forEach((slot, slotIndex) => {

            if (!slot.start || !slot.end) {
              throw new Error(
                `Override slot ${slotIndex} must contain start and end`
              );
            }

            if (slot.start >= slot.end) {
              throw new Error(
                `Invalid override slot timing at index ${slotIndex}`
              );
            }

          });

          return {
            from: fromDate,
            to: toDate,
            slots: override.slots
          };

        });

      }

      updates.availability = {
        weekly: weekly ?? existingDoctor.availability?.weekly ?? {},
        overrides: cleanedOverrides
      };

    }

    /* ================= ALLOWED FIELDS ================= */

    const allowedFields = [
      "name",
      "phone",
      "specialty",
      "gender",
      "about",
      "address",
      "consultationFee",
      "mode",
      "photo",
      "availability"
    ];

    Object.keys(updates).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete updates[key];
      }
    });

    /* ================= UPDATE DATABASE ================= */

    const doctor = await Doctor.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select("-password -__v");

    res.json({
      message: "Doctor profile updated successfully",
      doctor
    });

  } catch (error) {

    res.status(500).json({
      error: "Error updating doctor profile",
      details: error.message
    });

  }

};