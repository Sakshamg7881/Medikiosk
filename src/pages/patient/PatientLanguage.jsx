import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function PatientLanguage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/patient/login', { replace: true })
  }, [navigate])

  return null
}
export default PatientLanguage
