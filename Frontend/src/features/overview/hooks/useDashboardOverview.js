import { useCallback, useEffect, useState } from 'react'
import { DASHBOARD_SEMESTER } from '../../../shared/constants/api'
import { fetchDashboardOverview } from '../services/overviewService'

const DASHBOARD_INITIAL_DATA = {
  semester: DASHBOARD_SEMESTER,
  cards: {
    totalStudents: 0,
    totalTeachers: 0,
    totalOpenClasses: 0,
    totalCollectedTuition: 0,
  },
  charts: {
    studentsByMajor: [],
    tuitionStatus: [],
  },
}

export const useDashboardOverview = ({ refreshVersion = 0 } = {}) => {
  const [dashboardData, setDashboardData] = useState(DASHBOARD_INITIAL_DATA)
  const [dashboardError, setDashboardError] = useState('')
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)

  const loadDashboardOverview = useCallback(async () => {
    setIsDashboardLoading(true)
    setDashboardError('')

    try {
      const payload = await fetchDashboardOverview(DASHBOARD_SEMESTER)

      if (!payload?.success) {
        throw new Error('Không tải được dữ liệu tổng quan.')
      }

      setDashboardData({
        semester: payload.semester || '',
        cards: {
          totalStudents: payload.cards?.totalStudents || 0,
          totalTeachers: payload.cards?.totalTeachers || 0,
          totalOpenClasses: payload.cards?.totalOpenClasses || 0,
          totalCollectedTuition: payload.cards?.totalCollectedTuition || 0,
        },
        charts: {
          studentsByMajor: Array.isArray(payload.charts?.studentsByMajor)
            ? payload.charts.studentsByMajor
            : [],
          tuitionStatus: Array.isArray(payload.charts?.tuitionStatus)
            ? payload.charts.tuitionStatus
            : [],
        },
      })
    } catch (error) {
      const backendMessage = error.response?.data?.message
      setDashboardError(backendMessage || 'Không tải được dữ liệu tổng quan từ máy chủ.')
    } finally {
      setIsDashboardLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardOverview()
  }, [loadDashboardOverview, refreshVersion])

  return {
    dashboardData,
    dashboardError,
    isDashboardLoading,
    loadDashboardOverview,
  }
}
