import React, { useState, useEffect } from 'react';
import './EmployeeManagement.css';
import { getEmployeeList } from '../../api/employee';

const EmployeeManagement = () => {
  // 核心状态
  const [employeeList, setEmployeeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0
  });
  // 存储所有字段名（动态提取）
  const [allFields, setAllFields] = useState([]);

  // 获取员工列表
  const fetchEmployeeList = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getEmployeeList(pagination.page, pagination.size);
      setEmployeeList(res.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.total || 0
      }));

      // 动态提取所有字段名（从第一条数据中获取）
      if ((res.list || []).length > 0) {
        const fields = Object.keys(res.list[0]);
        // 字段名中文映射（提升可读性，可根据需要补充）
        const fieldCnMap = {
          employee_id: '员工ID',
          full_name: '姓名',
          gender: '性别',
          id_number: '身份证号',
          birth_date: '出生日期',
          age: '年龄',
          ethnicity: '民族',
          employment_status: '用工状态',
          registered_status: '在册状态',
          company: '所属公司',
          department_description: '部门描述',
          department_path: '部门路径',
          employee_category: '员工类别',
          position_name: '职位名称',
          job_type: '岗位类型',
          job_level: '岗位级别',
          highest_title: '最高职称',
          title_obtained_date: '职称获取日期',
          skill_level: '技能等级',
          skill_certificate_date: '技能证书日期',
          employment_form: '用工形式',
          work_start_date: '入职日期',
          job_category: '岗位分类',
          job_sequence: '岗位序列',
          job_family: '岗位族',
          post_category: '岗位类别',
          post_level: '岗位层级',
          school: '毕业院校',
          education: '学历',
          major: '专业',
          marital_status: '婚姻状况',
          political_status: '政治面貌',
          phone: '联系电话',
          home_address: '家庭住址',
          native_place: '籍贯',
          birthplace: '出生地',
          probationary_party_date: '预备党员日期',
          political_start_date: '入党日期',
          first_join_date: '首次入职日期',
          last_operation: '最后操作类型',
          operation_reason: '操作原因',
          employee_source: '员工来源',
          resignation_reason: '离职原因',
          transfer_reason: '调动原因',
          resignation_city: '离职城市',
          created_time: '创建时间',
          modified_time: '修改时间',
          position_code: '职位编码',
          occupation_code: '职业编码'
        };
        // 转换为「中文名称 + 英文key」的数组，方便渲染
        const mappedFields = fields.map(key => ({
          cn: fieldCnMap[key] || key, // 有中文映射则用中文，否则用原字段名
          key: key
        }));
        setAllFields(mappedFields);
      } else {
        setAllFields([]);
      }
    } catch (err) {
      setErrorMsg(err.message || '获取员工列表失败');
      setEmployeeList([]);
      setAllFields([]);
    } finally {
      setLoading(false);
    }
  };

  // 分页切换
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > Math.ceil(pagination.total / pagination.size)) return;
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // 初始化加载
  useEffect(() => {
    fetchEmployeeList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.size]);

  // 格式化日期字段（统一处理时间格式）
  const formatFieldValue = (key, value) => {
    if (!value) return '-';
    // 匹配所有日期/时间字段
    const dateFields = ['birth_date', 'title_obtained_date', 'skill_certificate_date', 
                        'work_start_date', 'probationary_party_date', 'political_start_date', 
                        'first_join_date', 'created_time', 'modified_time'];
    if (dateFields.includes(key)) {
      try {
        return new Date(value).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (e) {
        return value;
      }
    }
    // 处理地址等换行符
    if (key === 'home_address') {
      return value.replace(/\n/g, ' ');
    }
    return value;
  };

  return (
    <div className="employee-management">
      <div className="page-header">
        <h2>员工管理（全字段展示）</h2>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="loading-container">
          <span>正在加载员工数据...</span>
        </div>
      )}

      {/* 错误提示 */}
      {errorMsg && !loading && (
        <div className="error-container">
          <span className="error-text">{errorMsg}</span>
          <button onClick={fetchEmployeeList} className="reload-btn">重新加载</button>
        </div>
      )}

      {/* 员工列表（全字段表格） */}
      {!loading && !errorMsg && (
        <div className="employee-content">
          {employeeList.length === 0 ? (
            <div className="empty-container">暂无员工数据</div>
          ) : (
            <div className="table-wrapper">
              <table className="employee-full-table">
                <thead>
                  <tr>
                    {allFields.map((field, index) => (
                      <th key={index}>{field.cn}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeeList.map((emp, empIndex) => (
                    <tr key={empIndex}>
                      {allFields.map((field, fieldIndex) => (
                        <td key={fieldIndex}>
                          {formatFieldValue(field.key, emp[field.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页控件 */}
          <div className="pagination-container">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="pagination-btn"
            >
              上一页
            </button>
            <span className="page-info">
              第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.size)} 页
              （总条数：{pagination.total}）
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.size)}
              className="pagination-btn"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;