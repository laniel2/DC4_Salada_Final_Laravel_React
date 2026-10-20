import { useEffect, useState } from 'react'
import api from '../services/api'
import Message from '../components/Message'
import { useAuth } from '../context/AuthContext'

const emptyProfile = { name: '', email: '', phone: '', address: '' }
const emptyPassword = { current_password: '', password: '', password_confirmation: '' }

function errorMessage(error, fallback) {
  const errors = error.response?.data?.errors
  return errors ? Object.values(errors).flat().join(' ') : error.response?.data?.message || fallback
}

export default function CustomerProfile() {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState(emptyProfile)
  const [profileImage, setProfileImage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [password, setPassword] = useState(emptyPassword)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingImage, setSavingImage] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api.get('/customer/profile').then(async ({ data }) => {
      const customer = data.customer || {}
      setProfile({
        name: data.name || customer.name || '',
        email: data.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
      })
      if (data.has_profile_image) {
        const imageResponse = await api.get('/customer/profile/image', { responseType: 'blob' })
        setProfileImage(URL.createObjectURL(imageResponse.data))
      }
    }).catch(() => setError('Could not load your profile. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => () => {
    if (profileImage.startsWith('blob:')) URL.revokeObjectURL(profileImage)
  }, [profileImage])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return undefined
    }

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [imageFile])

  function updateField(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSavingProfile(true)
    setError('')
    setNotice('')
    try {
      const { data } = await api.patch('/customer/profile', profile)
      const customer = data.customer || {}
      const updated = {
        ...profile,
        name: data.name || customer.name || profile.name,
        email: data.email || profile.email,
        phone: customer.phone || '',
        address: customer.address || '',
      }
      setProfile(updated)
      updateUser({ name: updated.name, email: updated.email })
      setNotice('Your contact details have been updated.')
    } catch (err) {
      setError(errorMessage(err, 'Could not update your contact details.'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveImage(event) {
    event.preventDefault()
    if (!imageFile) return
    setSavingImage(true)
    setError('')
    setNotice('')
    try {
      const formData = new FormData()
      formData.append('profile_image', imageFile)
      await api.post('/customer/profile/image', formData)
      const { data } = await api.get('/customer/profile/image', { responseType: 'blob' })
      const nextImageUrl = URL.createObjectURL(data)
      setProfileImage(nextImageUrl)
      window.dispatchEvent(new Event('customer-profile-image-updated'))
      setImageFile(null)
      setNotice('Your profile photo has been updated.')
    } catch (err) {
      setError(errorMessage(err, 'Could not upload your profile photo.'))
    } finally {
      setSavingImage(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setSavingPassword(true)
    setError('')
    setNotice('')
    try {
      const { data } = await api.patch('/customer/password', password)
      setPassword(emptyPassword)
      setNotice(data.message || 'Your password has been changed.')
    } catch (err) {
      setError(errorMessage(err, 'Could not change your password.'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) return <p>Loading your profile...</p>

  return (
    <>
      <div className="page-heading"><div><h1>Your profile</h1><p>Manage your contact details, profile photo, and password.</p></div></div>
      <Message error>{error}</Message>
      {notice && <div className="message">{notice}</div>}

      <section className="panel customer-profile-photo-panel">
        <div className="customer-profile-photo-preview">
          {imagePreview || profileImage ? <img src={imagePreview || profileImage} alt="Profile photo preview" /> : <span>{profile.name?.[0]?.toUpperCase() || 'C'}</span>}
        </div>
        <form className="customer-profile-photo-form" onSubmit={saveImage}>
          <div><h2>Profile photo</h2><p>Choose an image up to 5 MB.</p></div>
          <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
          <button disabled={!imageFile || savingImage}>{savingImage ? 'Uploading...' : 'Save photo'}</button>
        </form>
      </section>

      <section className="panel account-panel customer-profile-panel">
        <h2>Contact details</h2>
        <form className="profile-form" onSubmit={saveProfile}>
          <label>Name<input name="name" value={profile.name} onChange={updateField} required /></label>
          <label>Email<input name="email" type="email" value={profile.email} onChange={updateField} required /></label>
          <label>Phone<input name="phone" value={profile.phone} onChange={updateField} /></label>
          <label>Address<input name="address" value={profile.address} onChange={updateField} /></label>
          <button disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save contact details'}</button>
        </form>
      </section>

      <section className="panel account-panel customer-password-panel">
        <h2>Change password</h2>
        <p>Enter your current password, then choose a new password with at least 8 characters.</p>
        <form className="profile-form" onSubmit={changePassword}>
          <label>Current password<input type="password" autoComplete="current-password" value={password.current_password} onChange={(event) => setPassword((current) => ({ ...current, current_password: event.target.value }))} required /></label>
          <label>New password<input type="password" autoComplete="new-password" value={password.password} onChange={(event) => setPassword((current) => ({ ...current, password: event.target.value }))} minLength="8" required /></label>
          <label>Confirm new password<input type="password" autoComplete="new-password" value={password.password_confirmation} onChange={(event) => setPassword((current) => ({ ...current, password_confirmation: event.target.value }))} minLength="8" required /></label>
          <button disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Change password'}</button>
        </form>
      </section>
    </>
  )
}
