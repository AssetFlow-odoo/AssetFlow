const Department = require('../models/Department');

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('departmentHeadId', 'name email')
      .populate('parentDepartmentId', 'name')
      .lean();
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving departments', error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, departmentHeadId, parentDepartmentId, status } = req.body;
    
    // Check if name already exists
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Department name already exists' });
    }

    const dept = new Department({
      name,
      departmentHeadId: departmentHeadId || null,
      parentDepartmentId: parentDepartmentId || null,
      status: status || 'Active'
    });

    await dept.save();
    
    // Populate before returning so UI has access to names immediately
    const populatedDept = await Department.findById(dept._id)
      .populate('departmentHeadId', 'name email')
      .populate('parentDepartmentId', 'name')
      .lean();

    res.status(201).json({ success: true, data: populatedDept });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating department', error: error.message });
  }
};
