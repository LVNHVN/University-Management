import { useClassManagement } from '../hooks/useClassManagement'
import ClassManagementView from './ClassManagementView'

function ClassManagement() {
  const props = useClassManagement()
  return <ClassManagementView {...props} />
}

export default ClassManagement
