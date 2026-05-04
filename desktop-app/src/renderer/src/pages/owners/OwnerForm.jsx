import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const PHONE_REGEX = /^(\+381|06)\d{7,9}$/

function validateOwner(f) {
    const errors = {}
    if (!f.first_name) errors.first_name = 'Ime je obavezno'
    if (!f.last_name) errors.last_name = 'Prezime je obavezno'
    if (f.phone && !PHONE_REGEX.test(f.phone))
        errors.phone = 'Format: +381XXXXXXXXX ili 06XXXXXXXX'
    return errors
}

// Definisano van komponente da React ne bi unmountovao/remountovao pri svakom renderu
function F({ name, label, required, type = 'text', fields, errors, touched, onChange, onBlur, ...rest }) {
    const showError = touched[name] && errors[name]
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input type={type} name={name} value={fields[name]}
                onChange={onChange} onBlur={onBlur}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${showError ? 'border-red-500' : 'border-gray-300'}`}
                {...rest} />
            {showError && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
        </div>
    )
}

const EMPTY = { first_name: '', last_name: '', phone: '', email: '', address: '', city: '' }

export default function OwnerForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = Boolean(id)

    const [fields, setFields] = useState(EMPTY)
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [saving, setSaving] = useState(false)
    const [serverError, setServerError] = useState('')

    useEffect(() => {
        if (!isEdit) return
        window.api.owners.getById(Number(id)).then(o => {
            if (!o) return
            setFields({
                first_name: o.first_name || '',
                last_name: o.last_name || '',
                phone: o.phone || '',
                email: o.email || '',
                address: o.address || '',
                city: o.city || ''
            })
        })
    }, [id])

    function handleChange(e) {
        const { name, value } = e.target
        setFields(f => ({ ...f, [name]: value }))
        if (touched[name]) setErrors(validateOwner({ ...fields, [name]: value }))
    }

    function handleBlur(e) {
        const { name } = e.target
        setTouched(t => ({ ...t, [name]: true }))
        setErrors(validateOwner(fields))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const allTouched = Object.keys(EMPTY).reduce((a, k) => ({ ...a, [k]: true }), {})
        setTouched(allTouched)
        const errs = validateOwner(fields)
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        setSaving(true)
        setServerError('')
        const result = isEdit
            ? await window.api.owners.update(Number(id), fields)
            : await window.api.owners.create(fields)

        if (result?.error) { setServerError(result.error); setSaving(false); return }
        navigate(isEdit ? `/owners/${id}` : `/owners/${result.id}`)
    }

    const hasValidationErrors = Object.keys(touched).length > 0 && Object.keys(validateOwner(fields)).length > 0

    return (
        <div className="p-6 max-w-lg">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Nazad</button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isEdit ? 'Izmena vlasnika' : 'Novi vlasnik'}
            </h2>

            {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <F name="first_name" label="Ime" required fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
                    <F name="last_name" label="Prezime" required fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
                </div>
                <F name="phone" label="Telefon" placeholder="+381XXXXXXXXX ili 06XXXXXXXX" fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
                <F name="email" label="Email" type="email" fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
                <F name="address" label="Adresa" fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
                <F name="city" label="Grad" fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving || hasValidationErrors}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                        {saving ? 'Snimanje...' : 'Sačuvaj'}
                    </button>
                    <button type="button" onClick={() => navigate(-1)}
                        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 text-sm">
                        Otkaži
                    </button>
                </div>
            </form>
        </div>
    )
}