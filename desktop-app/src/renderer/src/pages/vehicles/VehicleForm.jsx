import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i

// Definisano van komponente da React ne bi unmountovao/remountovao pri svakom renderu
function Field({ label, name, required, type = 'text', fields, errors, touched, onChange, onBlur, children, ...rest }) {
    const showError = touched[name] && errors[name]
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children || (
                <input
                    type={type}
                    name={name}
                    value={fields[name]}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${showError ? 'border-red-500' : 'border-gray-300'}`}
                    {...rest}
                />
            )}
            {showError && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
        </div>
    )
}

function validateVehicle(f) {
    const errors = {}
    if (!f.vin) errors.vin = 'VIN je obavezan'
    else if (!VIN_REGEX.test(f.vin)) errors.vin = 'VIN mora biti 17 alfanumeričkih karaktera (bez I, O, Q)'
    if (!f.make) errors.make = 'Marka je obavezna'
    if (!f.model) errors.model = 'Model je obavezan'
    if (!f.year) errors.year = 'Godište je obavezno'
    else if (Number(f.year) < 1900 || Number(f.year) > new Date().getFullYear() + 1)
        errors.year = 'Neispravno godište'
    return errors
}

// Field je definisan van VehicleForm da ne bi bio unmounted/remounted na svaki render
// (definisanje komponente unutar komponente uzrokuje gubitak fokusa pri kucanju)

const EMPTY = {
    vin: '', license_plate: '', make: '', model: '', year: '',
    engine_type: '', engine_displacement: '', engine_power: '',
    color: '', first_registration_date: '', notes: ''
}

export default function VehicleForm() {
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
        window.api.vehicles.getById(Number(id)).then(v => {
            if (!v) return
            setFields({
                vin: v.vin || '',
                license_plate: v.license_plate || '',
                make: v.make || '',
                model: v.model || '',
                year: v.year ? String(v.year) : '',
                engine_type: v.engine_type || '',
                engine_displacement: v.engine_displacement ? String(v.engine_displacement) : '',
                engine_power: v.engine_power ? String(v.engine_power) : '',
                color: v.color || '',
                first_registration_date: v.first_registration_date || '',
                notes: v.notes || ''
            })
        })
    }, [id])

    function handleChange(e) {
        const { name, value } = e.target
        setFields(f => ({ ...f, [name]: value }))
        if (touched[name]) setErrors(validateVehicle({ ...fields, [name]: value }))
    }

    function handleBlur(e) {
        const { name } = e.target
        setTouched(t => ({ ...t, [name]: true }))
        setErrors(validateVehicle(fields))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const allTouched = Object.keys(EMPTY).reduce((a, k) => ({ ...a, [k]: true }), {})
        setTouched(allTouched)
        const errs = validateVehicle(fields)
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        setSaving(true)
        setServerError('')
        const data = {
            ...fields,
            vin: fields.vin.toUpperCase(),
            year: Number(fields.year),
            engine_displacement: fields.engine_displacement ? Number(fields.engine_displacement) : null,
            engine_power: fields.engine_power ? Number(fields.engine_power) : null,
        }

        const result = isEdit
            ? await window.api.vehicles.update(Number(id), data)
            : await window.api.vehicles.create(data)

        if (result?.error) {
            setServerError(result.error)
            setSaving(false)
            return
        }

        navigate(isEdit ? `/vehicles/${id}` : `/vehicles/${result.id}`)
    }

    const hasValidationErrors = Object.keys(touched).length > 0 && Object.keys(validateVehicle(fields)).length > 0

    return (
        <div className="p-6 max-w-2xl">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Nazad</button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isEdit ? 'Izmena vozila' : 'Novo vozilo'}
            </h2>

            {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Field name="vin" label="VIN" required fields={fields} errors={errors} touched={touched}
                    onChange={handleChange} onBlur={handleBlur} placeholder="npr. WBA1A2B3C4D567890" />

                <div className="grid grid-cols-2 gap-4">
                    <Field name="make" label="Marka" required fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur} placeholder="npr. Volkswagen" />
                    <Field name="model" label="Model" required fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur} placeholder="npr. Golf" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field name="year" label="Godište" required type="number" fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur} min="1900" max={new Date().getFullYear() + 1} />
                    <Field name="license_plate" label="Registarska oznaka" fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Field name="engine_type" label="Vrsta motora" fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur}>
                        <select name="engine_type" value={fields.engine_type} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">—</option>
                            <option value="benzin">Benzin</option>
                            <option value="dizel">Dizel</option>
                            <option value="elektro">Elektro</option>
                            <option value="hibrid">Hibrid</option>
                        </select>
                    </Field>
                    <Field name="engine_displacement" label="Zapremina (cm³)" type="number" fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur} min="0" />
                    <Field name="engine_power" label="Snaga (kW)" type="number" fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur} min="0" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field name="color" label="Boja" fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur} />
                    <Field name="first_registration_date" label="Prva registracija" type="date" fields={fields} errors={errors} touched={touched}
                        onChange={handleChange} onBlur={handleBlur} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Napomene</label>
                    <textarea name="notes" value={fields.notes} onChange={handleChange} rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

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