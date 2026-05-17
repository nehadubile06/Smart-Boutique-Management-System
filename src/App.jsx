
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  IndianRupee,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import { auth, db, isFirebaseConfigured } from './firebase'

const tabs = ['dashboard', 'customers', 'orders', 'billing']
const orderStatuses = ['Pending', 'In Progress', 'Ready', 'Delivered']
const paymentStatuses = ['Unpaid', 'Partially Paid', 'Paid']
const publicServices = [
  {
    title: 'Designer Dresses',
    description: 'Elegant silhouettes for festive occasions, receptions, and statement celebrations.',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Blouse Stitching',
    description: 'Precision stitching for perfect fit, comfort, neckline detailing, and premium finishing.',
    image:
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Jewellery',
    description: 'Curated pieces that complete your outfit with graceful and timeless styling.',
    image:
      'https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Custom Designs',
    description: 'Personalized design consultation to create outfits tailored to your personality.',
    image:
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?auto=format&fit=crop&w=900&q=80',
  },
]
const publicTestimonials = [
  {
    name: 'Shraddha P.',
    text: 'Perfect fitting and very elegant finishing. My festive outfit looked exactly how I imagined.',
  },
  {
    name: 'Komal J.',
    text: 'Amazing blouse stitching quality and on-time delivery. The fit was absolutely perfect.',
  },
  {
    name: 'Aarti K.',
    text: 'Great service and beautiful custom design guidance. Highly recommended in Kolhapur.',
  },
]
const galleryFilters = ['All', 'Dresses', 'Blouses', 'Jewellery']
const publicGallery = [
  {
    title: 'Rose Gold Party Dress',
    category: 'Dresses',
    image:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Mirror Work Blouse',
    category: 'Blouses',
    image:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Temple Jewellery Set',
    category: 'Jewellery',
    image:
      'https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Pastel Designer Dress',
    category: 'Dresses',
    image:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Wedding Saree Blouse',
    category: 'Blouses',
    image:
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Minimal Gold Earrings',
    category: 'Jewellery',
    image:
      'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80',
  },
]

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
}
const sectionReveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.45 },
}

const inputClass =
  'mt-1 w-full rounded-xl border border-rose/20 bg-white/85 px-3 py-2 text-sm text-rose outline-none focus:border-gold/60'

const num = (value) => Number(value || 0)
const phonePattern = /^[6-9]\d{9}$/
const chartColors = ['#B76E79', '#D4AF37', '#E8B4B8', '#C98975', '#A67A83']

function App() {
  const [tab, setTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [theme, setTheme] = useState('light')
  const [publicTestimonialIndex, setPublicTestimonialIndex] = useState(0)
  const [activeGalleryFilter, setActiveGalleryFilter] = useState('All')
  const [selectedGalleryItem, setSelectedGalleryItem] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [publicContactForm, setPublicContactForm] = useState({ name: '', phone: '', message: '' })
  const [publicContactError, setPublicContactError] = useState('')
  const [publicContactSuccess, setPublicContactSuccess] = useState('')
  const [publicBookingForm, setPublicBookingForm] = useState({
    name: '',
    phone: '',
    serviceType: '',
    date: '',
    notes: '',
  })
  const [publicBookingError, setPublicBookingError] = useState('')
  const [publicBookingSuccess, setPublicBookingSuccess] = useState('')

  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [publicBookings, setPublicBookings] = useState([])
  const [publicInquiries, setPublicInquiries] = useState([])

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    bust: '',
    waist: '',
    hip: '',
    length: '',
  })
  const [editingCustomerId, setEditingCustomerId] = useState(null)

  const [orderForm, setOrderForm] = useState({
    customerId: '',
    dressType: '',
    deliveryDate: '',
    status: 'Pending',
    totalAmount: '',
    advancePayment: '',
    paymentStatus: 'Unpaid',
    notes: '',
  })

  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user || !db) {
      setCustomers([])
      setOrders([])
      setPublicBookings([])
      setPublicInquiries([])
      setDataLoading(false)
      return
    }

    setDataLoading(true)

    const customersQuery = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const publicBookingsQuery = query(collection(db, 'public_bookings'), orderBy('createdAt', 'desc'))
    const publicInquiriesQuery = query(collection(db, 'contact_inquiries'), orderBy('createdAt', 'desc'))

    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
      setCustomers(snapshot.docs.map((docu) => ({ id: docu.id, ...docu.data() })))
      setDataLoading(false)
    })

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map((docu) => ({ id: docu.id, ...docu.data() })))
      setDataLoading(false)
    })

    const unsubPublicBookings = onSnapshot(publicBookingsQuery, (snapshot) => {
      setPublicBookings(snapshot.docs.map((docu) => ({ id: docu.id, ...docu.data() })))
      setDataLoading(false)
    })

    const unsubPublicInquiries = onSnapshot(publicInquiriesQuery, (snapshot) => {
      setPublicInquiries(snapshot.docs.map((docu) => ({ id: docu.id, ...docu.data() })))
      setDataLoading(false)
    })

    return () => {
      unsubCustomers()
      unsubOrders()
      unsubPublicBookings()
      unsubPublicInquiries()
    }
  }, [user])

  useEffect(() => {
    const timer = setInterval(() => {
      setPublicTestimonialIndex((prev) => (prev + 1) % publicTestimonials.length)
    }, 4200)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('payal-theme')
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme)
  }, [])

  useEffect(() => {
    localStorage.setItem('payal-theme', theme)
  }, [theme])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') setSelectedGalleryItem(null)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + num(order.totalAmount), 0)
    return {
      totalCustomers: customers.length,
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === 'Pending').length,
      totalRevenue,
      totalBookings: publicBookings.length,
      totalInquiries: publicInquiries.length,
    }
  }, [customers, orders, publicBookings, publicInquiries])

  const serviceDistributionData = useMemo(() => {
    const grouped = publicBookings.reduce((acc, booking) => {
      const key = booking.serviceType || 'Other'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [publicBookings])

  const dailyBookingsData = useMemo(() => {
    const grouped = publicBookings.reduce((acc, booking) => {
      const key = booking.date || 'Unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return Object.entries(grouped)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-10)
      .map(([date, bookings]) => ({ date, bookings }))
  }, [publicBookings])

  const filteredGallery =
    activeGalleryFilter === 'All'
      ? publicGallery
      : publicGallery.filter((item) => item.category === activeGalleryFilter)
  const minPublicBookingDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    if (!auth) return

    try {
      await setPersistence(auth, browserLocalPersistence)
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password)
    } catch (error) {
      setLoginError(error.message || 'Login failed')
    }
  }

  const handleLogout = async () => {
    if (!auth) return
    await signOut(auth)
  }

  const resetCustomerForm = () => {
    setCustomerForm({ name: '', phone: '', email: '', bust: '', waist: '', hip: '', length: '' })
    setEditingCustomerId(null)
  }

  const submitCustomer = async (event) => {
    event.preventDefault()
    if (!customerForm.name || !customerForm.phone) return

    const payload = {
      name: customerForm.name,
      phone: customerForm.phone,
      email: customerForm.email,
      measurements: {
        bust: customerForm.bust,
        waist: customerForm.waist,
        hip: customerForm.hip,
        length: customerForm.length,
      },
      updatedAt: serverTimestamp(),
    }

    if (editingCustomerId) {
      await updateDoc(doc(db, 'customers', editingCustomerId), payload)
      setMessage('Customer updated successfully.')
    } else {
      await addDoc(collection(db, 'customers'), {
        ...payload,
        createdAt: serverTimestamp(),
      })
      setMessage('Customer added successfully.')
    }

    resetCustomerForm()
  }

  const startEditCustomer = (customer) => {
    setEditingCustomerId(customer.id)
    setCustomerForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      bust: customer.measurements?.bust || '',
      waist: customer.measurements?.waist || '',
      hip: customer.measurements?.hip || '',
      length: customer.measurements?.length || '',
    })
  }

  const removeCustomer = async (id) => {
    await deleteDoc(doc(db, 'customers', id))
    setMessage('Customer deleted.')
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    if (!orderForm.customerId || !orderForm.dressType || !orderForm.deliveryDate) return

    const selectedCustomer = customers.find((customer) => customer.id === orderForm.customerId)
    const totalAmount = num(orderForm.totalAmount)
    const advancePayment = num(orderForm.advancePayment)
    const remainingAmount = Math.max(totalAmount - advancePayment, 0)

    await addDoc(collection(db, 'orders'), {
      customerId: orderForm.customerId,
      customerName: selectedCustomer?.name || '',
      dressType: orderForm.dressType,
      deliveryDate: orderForm.deliveryDate,
      status: orderForm.status,
      totalAmount,
      advancePayment,
      remainingAmount,
      paymentStatus: orderForm.paymentStatus,
      notes: orderForm.notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    setOrderForm({
      customerId: '',
      dressType: '',
      deliveryDate: '',
      status: 'Pending',
      totalAmount: '',
      advancePayment: '',
      paymentStatus: 'Unpaid',
      notes: '',
    })

    setMessage('Order created successfully.')
  }

  const updateOrderStatus = async (orderId, status) => {
    await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() })
  }

  const updateBilling = async (order) => {
    const totalAmount = num(order.totalAmount)
    const advancePayment = num(order.advancePayment)
    const remainingAmount = Math.max(totalAmount - advancePayment, 0)

    await updateDoc(doc(db, 'orders', order.id), {
      totalAmount,
      advancePayment,
      remainingAmount,
      paymentStatus: order.paymentStatus,
      updatedAt: serverTimestamp(),
    })

    setMessage('Billing updated.')
  }

  const submitPublicContact = async (event) => {
    event.preventDefault()
    setPublicContactError('')
    setPublicContactSuccess('')

    if (!publicContactForm.name.trim() || !publicContactForm.phone.trim() || !publicContactForm.message.trim()) {
      setPublicContactError('Please fill all contact form fields.')
      return
    }
    if (!phonePattern.test(publicContactForm.phone.trim())) {
      setPublicContactError('Please enter a valid 10-digit mobile number.')
      return
    }

    if (!db) {
      setPublicContactError('Database is not configured. Please try again later.')
      return
    }

    try {
      await addDoc(collection(db, 'contact_inquiries'), {
        name: publicContactForm.name.trim(),
        phone: publicContactForm.phone.trim(),
        message: publicContactForm.message.trim(),
        createdAt: serverTimestamp(),
      })

      setPublicContactSuccess('Message submitted successfully. We will contact you soon.')
      setPublicContactForm({ name: '', phone: '', message: '' })
    } catch (error) {
      setPublicContactError(error.message || 'Failed to submit message.')
    }
  }

  const submitPublicBooking = async (event) => {
    event.preventDefault()
    setPublicBookingError('')
    setPublicBookingSuccess('')

    if (
      !publicBookingForm.name.trim() ||
      !publicBookingForm.phone.trim() ||
      !publicBookingForm.serviceType.trim() ||
      !publicBookingForm.date.trim()
    ) {
      setPublicBookingError('Please fill required booking details.')
      return
    }
    if (!phonePattern.test(publicBookingForm.phone.trim())) {
      setPublicBookingError('Please enter a valid 10-digit mobile number.')
      return
    }
    if (publicBookingForm.date < minPublicBookingDate) {
      setPublicBookingError('Please select today or a future date.')
      return
    }

    if (!db) {
      setPublicBookingError('Database is not configured. Please try again later.')
      return
    }

    try {
      await addDoc(collection(db, 'public_bookings'), {
        name: publicBookingForm.name.trim(),
        phone: publicBookingForm.phone.trim(),
        serviceType: publicBookingForm.serviceType.trim(),
        date: publicBookingForm.date,
        notes: publicBookingForm.notes.trim(),
        createdAt: serverTimestamp(),
      })

      setPublicBookingSuccess('Booking submitted successfully. We will confirm shortly.')
      setPublicBookingForm({ name: '', phone: '', serviceType: '', date: '', notes: '' })
    } catch (error) {
      setPublicBookingError(error.message || 'Failed to submit booking.')
    }
  }
  if (user) {
    return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-cream text-rose"
    >
      <header className="sticky top-0 z-30 border-b border-white/45 bg-cream/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-heading text-3xl">Payal Admin Dashboard</h1>
            <p className="text-xs uppercase tracking-[0.16em] text-gold">Session: {user.email}</p>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2 text-sm font-semibold text-cream">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                tab === item ? 'bg-rose text-cream' : 'bg-white/70 text-rose border border-rose/20'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {message && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        )}

        {dataLoading && <p className="mb-4 text-sm">Syncing data...</p>}

        {tab === 'dashboard' && (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <motion.article {...cardMotion} className="rounded-2xl bg-white/75 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-gold"><Users size={18} /> Customers</div>
                <p className="mt-3 font-heading text-4xl">{stats.totalCustomers}</p>
              </motion.article>
              <motion.article {...cardMotion} transition={{ delay: 0.04 }} className="rounded-2xl bg-white/75 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-gold"><ShoppingBag size={18} /> Orders</div>
                <p className="mt-3 font-heading text-4xl">{stats.totalOrders}</p>
              </motion.article>
              <motion.article {...cardMotion} transition={{ delay: 0.08 }} className="rounded-2xl bg-white/75 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-gold"><Clock3 size={18} /> Pending Orders</div>
                <p className="mt-3 font-heading text-4xl">{stats.pendingOrders}</p>
              </motion.article>
              <motion.article {...cardMotion} transition={{ delay: 0.12 }} className="rounded-2xl bg-white/75 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-gold"><IndianRupee size={18} /> Revenue</div>
                <p className="mt-3 font-heading text-4xl">{stats.totalRevenue.toLocaleString('en-IN')}</p>
              </motion.article>
              <motion.article {...cardMotion} transition={{ delay: 0.16 }} className="rounded-2xl bg-white/75 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-gold"><ShoppingBag size={18} /> Total Bookings</div>
                <p className="mt-3 font-heading text-4xl">{stats.totalBookings}</p>
              </motion.article>
              <motion.article {...cardMotion} transition={{ delay: 0.2 }} className="rounded-2xl bg-white/75 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-gold"><Users size={18} /> Inquiries</div>
                <p className="mt-3 font-heading text-4xl">{stats.totalInquiries}</p>
              </motion.article>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <motion.article {...cardMotion} className="rounded-2xl bg-white/75 p-5 shadow-soft">
                <h3 className="font-heading text-2xl">Services Distribution</h3>
                <div className="mt-4 h-72">
                  {serviceDistributionData.length === 0 ? (
                    <p className="text-sm text-rose/70">No booking data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={serviceDistributionData} dataKey="value" nameKey="name" outerRadius={90} label>
                          {serviceDistributionData.map((entry, index) => (
                            <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.article>

              <motion.article {...cardMotion} transition={{ delay: 0.06 }} className="rounded-2xl bg-white/75 p-5 shadow-soft">
                <h3 className="font-heading text-2xl">Daily Bookings</h3>
                <div className="mt-4 h-72">
                  {dailyBookingsData.length === 0 ? (
                    <p className="text-sm text-rose/70">No booking trend data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyBookingsData}>
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bookings" stroke="#B76E79" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.article>
            </div>
          </section>
        )}

        {tab === 'customers' && (
          <section className="grid gap-6 lg:grid-cols-[360px,1fr]">
            <form onSubmit={submitCustomer} className="rounded-2xl bg-white/75 p-5 shadow-soft">
              <h2 className="font-heading text-2xl">{editingCustomerId ? 'Edit Customer' : 'Add Customer'}</h2>
              <label className="mt-3 block text-sm">Name<input value={customerForm.name} onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} required /></label>
              <label className="mt-3 block text-sm">Phone<input value={customerForm.phone} onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))} className={inputClass} required /></label>
              <label className="mt-3 block text-sm">Email<input value={customerForm.email} onChange={(e) => setCustomerForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} /></label>

              <p className="mt-4 text-sm font-semibold text-gold">Measurements</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input placeholder="Bust" value={customerForm.bust} onChange={(e) => setCustomerForm((p) => ({ ...p, bust: e.target.value }))} className={inputClass} />
                <input placeholder="Waist" value={customerForm.waist} onChange={(e) => setCustomerForm((p) => ({ ...p, waist: e.target.value }))} className={inputClass} />
                <input placeholder="Hip" value={customerForm.hip} onChange={(e) => setCustomerForm((p) => ({ ...p, hip: e.target.value }))} className={inputClass} />
                <input placeholder="Length" value={customerForm.length} onChange={(e) => setCustomerForm((p) => ({ ...p, length: e.target.value }))} className={inputClass} />
              </div>

              <div className="mt-4 flex gap-2">
                <button type="submit" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-cream">
                  <span className="inline-flex items-center gap-1"><UserPlus size={14} /> {editingCustomerId ? 'Update' : 'Add'}</span>
                </button>
                {editingCustomerId && <button type="button" onClick={resetCustomerForm} className="rounded-full border border-rose/25 px-4 py-2 text-sm">Cancel</button>}
              </div>
            </form>

            <div className="overflow-x-auto rounded-2xl bg-white/75 p-5 shadow-soft">
              <h2 className="font-heading text-2xl">Customer List</h2>
              <table className="mt-4 min-w-full text-left text-sm">
                <thead>
                  <tr className="text-gold">
                    <th className="pb-2">Name</th><th className="pb-2">Phone</th><th className="pb-2">Measurements</th><th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-rose/10">
                      <td className="py-2">{customer.name}</td>
                      <td className="py-2">{customer.phone}</td>
                      <td className="py-2 text-xs">B:{customer.measurements?.bust || '-'} W:{customer.measurements?.waist || '-'} H:{customer.measurements?.hip || '-'} L:{customer.measurements?.length || '-'}</td>
                      <td className="py-2">
                        <button onClick={() => startEditCustomer(customer)} className="mr-2 rounded border border-rose/20 px-2 py-1 text-xs">Edit</button>
                        <button onClick={() => removeCustomer(customer.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"><Trash2 size={13} className="inline" /> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'orders' && (
          <section className="grid gap-6 lg:grid-cols-[380px,1fr]">
            <form onSubmit={submitOrder} className="rounded-2xl bg-white/75 p-5 shadow-soft">
              <h2 className="font-heading text-2xl">Create New Order</h2>
              <label className="mt-3 block text-sm">Customer
                <select value={orderForm.customerId} onChange={(e) => setOrderForm((p) => ({ ...p, customerId: e.target.value }))} className={inputClass} required>
                  <option value="">Select customer</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-sm">Dress Type<input value={orderForm.dressType} onChange={(e) => setOrderForm((p) => ({ ...p, dressType: e.target.value }))} className={inputClass} required /></label>
              <label className="mt-3 block text-sm">Delivery Date<input type="date" value={orderForm.deliveryDate} onChange={(e) => setOrderForm((p) => ({ ...p, deliveryDate: e.target.value }))} className={inputClass} required /></label>
              <label className="mt-3 block text-sm">Status<select value={orderForm.status} onChange={(e) => setOrderForm((p) => ({ ...p, status: e.target.value }))} className={inputClass}>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="mt-3 block text-sm">Total Amount<input type="number" min="0" value={orderForm.totalAmount} onChange={(e) => setOrderForm((p) => ({ ...p, totalAmount: e.target.value }))} className={inputClass} /></label>
              <label className="mt-3 block text-sm">Advance Payment<input type="number" min="0" value={orderForm.advancePayment} onChange={(e) => setOrderForm((p) => ({ ...p, advancePayment: e.target.value }))} className={inputClass} /></label>
              <label className="mt-3 block text-sm">Payment Status<select value={orderForm.paymentStatus} onChange={(e) => setOrderForm((p) => ({ ...p, paymentStatus: e.target.value }))} className={inputClass}>{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="mt-3 block text-sm">Notes<textarea value={orderForm.notes} onChange={(e) => setOrderForm((p) => ({ ...p, notes: e.target.value }))} className={`${inputClass} min-h-20 resize-none`} /></label>
              <button type="submit" className="mt-4 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-cream">Create Order</button>
            </form>
            <div className="overflow-x-auto rounded-2xl bg-white/75 p-5 shadow-soft">
              <h2 className="font-heading text-2xl">Order Management</h2>
              <table className="mt-4 min-w-full text-left text-sm">
                <thead>
                  <tr className="text-gold">
                    <th className="pb-2">Customer</th><th className="pb-2">Dress</th><th className="pb-2">Delivery</th><th className="pb-2">Status</th><th className="pb-2">Billing</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-rose/10">
                      <td className="py-2">{order.customerName}</td>
                      <td className="py-2">{order.dressType}</td>
                      <td className="py-2">{order.deliveryDate}</td>
                      <td className="py-2">
                        <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="rounded border border-rose/20 bg-white px-2 py-1 text-xs">
                          {orderStatuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="py-2 text-xs">Rs {num(order.totalAmount)} / Adv {num(order.advancePayment)} / Rem {num(order.remainingAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'billing' && (
          <section className="overflow-x-auto rounded-2xl bg-white/75 p-5 shadow-soft">
            <h2 className="font-heading text-2xl">Billing & Payment Module</h2>
            <table className="mt-4 min-w-full text-left text-sm">
              <thead>
                <tr className="text-gold">
                  <th className="pb-2">Customer</th><th className="pb-2">Order</th><th className="pb-2">Total</th><th className="pb-2">Advance</th><th className="pb-2">Remaining</th><th className="pb-2">Payment Status</th><th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-rose/10 align-top">
                    <td className="py-2">{order.customerName}</td>
                    <td className="py-2">{order.dressType}</td>
                    <td className="py-2">
                      <input type="number" min="0" value={order.totalAmount || 0} onChange={(e) => setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, totalAmount: e.target.value } : item))} className="w-24 rounded border border-rose/20 px-2 py-1" />
                    </td>
                    <td className="py-2">
                      <input type="number" min="0" value={order.advancePayment || 0} onChange={(e) => setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, advancePayment: e.target.value } : item))} className="w-24 rounded border border-rose/20 px-2 py-1" />
                    </td>
                    <td className="py-2">Rs {Math.max(num(order.totalAmount) - num(order.advancePayment), 0)}</td>
                    <td className="py-2">
                      <select value={order.paymentStatus || 'Unpaid'} onChange={(e) => setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, paymentStatus: e.target.value } : item))} className="rounded border border-rose/20 bg-white px-2 py-1 text-xs">
                        {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="py-2">
                      <button onClick={() => updateBilling(order)} className="inline-flex items-center gap-1 rounded border border-gold/40 bg-white px-3 py-1 text-xs"><Save size={13} /> Save</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </motion.div>
  )
  }

  const publicThemeClass =
    theme === 'dark'
      ? 'bg-[#2f2628] text-[#f3e8ea]'
      : 'bg-cream text-rose'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`min-h-screen ${publicThemeClass}`}
    >
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-20 border-b backdrop-blur-lg transition-all ${
          isScrolled
            ? 'border-white/35 bg-white/80 shadow-soft'
            : 'border-white/20 bg-white/55'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-heading text-3xl">Payal Fashion Designing</h1>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">Ladies Wear & Stitching Center</p>
          </div>
          <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
            <a href="#home" className="transition hover:text-gold">Home</a>
            <a href="#services" className="transition hover:text-gold">Services</a>
            <a href="#gallery" className="transition hover:text-gold">Gallery</a>
            <a href="#about" className="transition hover:text-gold">About</a>
            <a href="#contact" className="transition hover:text-gold">Contact</a>
            <a href="#booking" className="transition hover:text-gold">Booking</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className="rounded-full border border-rose/20 bg-white/80 p-2 text-rose"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className="btn-animated inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2 text-sm font-semibold text-cream shadow-soft"
            >
              <ShieldCheck size={16} />
              Admin Panel
            </button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        <motion.section {...sectionReveal} id="home" className="grid items-center gap-8 rounded-3xl border border-white/60 bg-white/65 p-8 shadow-soft lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <Sparkles size={14} />
              Premium Studio
            </p>
            <h2 className="mt-4 font-heading text-5xl leading-tight">Payal Fashion Designing</h2>
            <p className="mt-2 text-lg font-medium text-rose/85">Ladies Wear & Stitching Center</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-rose/80">
              Elegant stitching, designer dresses, jewellery styling, and custom looks crafted with precision in Kolhapur.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://wa.me/917843016325?text=Hello%20Payal%20Fashion%20Designing%2C%20I%20want%20to%20book%20an%20appointment."
                target="_blank"
                rel="noreferrer"
                className="btn-animated inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-cream shadow-soft transition hover:shadow-glow"
              >
                Book Now
              </a>
              <a href="tel:7843016325" className="btn-animated inline-flex items-center gap-2 rounded-full border border-rose/20 bg-white/75 px-5 py-2 text-sm font-semibold text-rose">
                <Phone size={15} />
                Call Now
              </a>
              <a href="#services" className="rounded-full border border-rose/20 bg-white/75 px-5 py-2 text-sm font-semibold">Explore Services</a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-blush/45 to-cream p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Animated Banner</p>
            <p className="mt-2 text-lg font-semibold">Trending Fashion Visuals</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {['Bridal Looks', 'Party Wear', 'Silk Blouses', 'Custom Dresses'].map((item, idx) => (
                <motion.div
                  key={item}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.6 + idx * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-xl bg-white/70 px-3 py-3 font-medium shadow-soft"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionReveal} id="services" className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Services Page</p>
            <h3 className="mt-2 font-heading text-4xl">Signature Services</h3>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {publicServices.map((service, index) => (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group overflow-hidden rounded-2xl border border-white/60 bg-white/75 shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-glow"
              >
                <div className="h-52 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-5">
                  <h4 className="font-heading text-2xl">{service.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-rose/80">{service.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionReveal} id="gallery" className="mt-10 rounded-3xl border border-white/60 bg-white/70 p-7 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Gallery Page</p>
          <h3 className="mt-2 font-heading text-4xl">Fashion Gallery</h3>

          <div className="mt-5 flex flex-wrap gap-2">
            {galleryFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveGalleryFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeGalleryFilter === filter
                    ? 'bg-rose text-cream'
                    : 'border border-rose/20 bg-white text-rose'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {filteredGallery.map((item, index) => (
              <motion.button
                key={`${item.title}-${item.category}`}
                type="button"
                onClick={() => setSelectedGalleryItem(item)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="group mb-4 w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/55 bg-white text-left shadow-soft transition hover:-translate-y-1 hover:shadow-glow"
              >
                <div className={`overflow-hidden ${index % 3 === 0 ? 'h-80' : index % 3 === 1 ? 'h-64' : 'h-72'}`}>
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{item.category}</p>
                  <p className="mt-1 font-heading text-2xl text-rose">{item.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionReveal} id="about" className="mt-10 rounded-3xl border border-white/60 bg-white/70 p-7 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">About Us</p>
          <h3 className="mt-2 font-heading text-4xl">Crafted With Passion in Kolhapur</h3>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/55 bg-white/80 p-5 lg:col-span-2"
            >
              <h4 className="font-heading text-2xl">Story of the Shop</h4>
              <p className="mt-2 text-sm leading-7 text-rose/85">
                Payal Fashion Designing started as a neighborhood stitching center in Sankpal Nagar with one simple idea:
                create outfits that truly match every woman&apos;s personality and comfort. Through trust, detailed craftsmanship,
                and repeat customers, the studio has grown into a loved local fashion destination.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-white/55 bg-white/80 p-5"
            >
              <h4 className="font-heading text-2xl">Experience Highlight</h4>
              <p className="mt-2 text-sm leading-7 text-rose/85">
                Hundreds of successful fittings across festive wear, bridal blouses, custom dresses, and styling support.
              </p>
              <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                Trusted Local Craftsmanship
              </p>
            </motion.article>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/55 bg-white/80 p-5"
            >
              <h4 className="font-heading text-2xl">Mission</h4>
              <p className="mt-2 text-sm leading-7 text-rose/85">
                To deliver elegant, well-fitted, and affordable ladies wear with premium finishing and warm service.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-white/55 bg-white/80 p-5"
            >
              <h4 className="font-heading text-2xl">Vision</h4>
              <p className="mt-2 text-sm leading-7 text-rose/85">
                To become Kolhapur&apos;s most trusted destination for ladies fashion design and personalized stitching.
              </p>
            </motion.article>
          </div>
        </motion.section>

        <motion.section {...sectionReveal} className="mt-10 rounded-3xl border border-white/60 bg-white/70 p-7 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-3xl">Testimonials</h3>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPublicTestimonialIndex((prev) => (prev - 1 + publicTestimonials.length) % publicTestimonials.length)
                }
                className="rounded-full border border-rose/20 bg-white px-2 py-1"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setPublicTestimonialIndex((prev) => (prev + 1) % publicTestimonials.length)
                }
                className="rounded-full border border-rose/20 bg-white px-2 py-1"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-rose/85">
            "{publicTestimonials[publicTestimonialIndex].text}"
          </p>
          <p className="mt-2 text-sm font-semibold">{publicTestimonials[publicTestimonialIndex].name}</p>
        </motion.section>

        <motion.section {...sectionReveal} className="mt-10 rounded-3xl border border-white/60 bg-gradient-to-r from-rose/85 to-gold/80 p-7 text-cream shadow-soft">
          <h3 className="font-heading text-3xl">Ready to Style Your Next Outfit?</h3>
          <p className="mt-2 text-sm text-cream/90">
            Book your consultation today and get personalized design guidance for every occasion.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://wa.me/917843016325?text=Hello%20Payal%20Fashion%20Designing%2C%20I%20want%20to%20book%20an%20appointment."
              target="_blank"
              rel="noreferrer"
              className="btn-animated rounded-full bg-cream px-5 py-2 text-sm font-semibold text-rose"
            >
              Book Now
            </a>
            <button
              onClick={() => setShowAdminModal(true)}
              className="btn-animated rounded-full border border-cream/60 px-5 py-2 text-sm font-semibold text-cream"
            >
              Open Admin Panel
            </button>
          </div>
        </motion.section>

        <motion.section {...sectionReveal} id="contact" className="mt-10 rounded-3xl border border-white/60 bg-white/70 p-7 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Contact Page</p>
          <h3 className="mt-2 font-heading text-4xl">Get In Touch</h3>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <form onSubmit={submitPublicContact} className="rounded-2xl border border-white/55 bg-white/80 p-5">
              <h4 className="font-heading text-2xl">Contact Form</h4>

              <label className="mt-3 block text-sm font-medium">
                Name
                <input
                  type="text"
                  value={publicContactForm.name}
                  onChange={(event) => setPublicContactForm((prev) => ({ ...prev, name: event.target.value }))}
                  className={inputClass}
                  required
                />
              </label>

              <label className="mt-3 block text-sm font-medium">
                Phone
                <input
                  type="tel"
                  value={publicContactForm.phone}
                  onChange={(event) => setPublicContactForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className={inputClass}
                  required
                />
              </label>

              <label className="mt-3 block text-sm font-medium">
                Message
                <textarea
                  value={publicContactForm.message}
                  onChange={(event) => setPublicContactForm((prev) => ({ ...prev, message: event.target.value }))}
                  className={`${inputClass} min-h-24 resize-none`}
                  required
                />
              </label>

              <button type="submit" className="btn-animated mt-4 rounded-full bg-rose px-5 py-2 text-sm font-semibold text-cream">
                Submit
              </button>

              {publicContactError && <p className="mt-3 text-xs text-red-600">{publicContactError}</p>}
              {publicContactSuccess && <p className="mt-3 text-xs text-emerald-700">{publicContactSuccess}</p>}
            </form>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/55 bg-white/80 p-5">
                <h4 className="font-heading text-2xl">Phone & Address</h4>
                <p className="mt-3 inline-flex items-start gap-2 text-sm"><MapPin size={16} className="mt-0.5" /> Sankpal Nagar, Kasba Bawda, Kolhapur</p>
                <p className="mt-2 inline-flex items-start gap-2 text-sm"><Phone size={16} className="mt-0.5" /> 7843016325 | 8999256132</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/55 shadow-soft">
                <iframe
                  title="Kolhapur map"
                  src="https://maps.google.com/maps?q=Kasba%20Bawda%20Kolhapur&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionReveal} id="booking" className="mt-10 rounded-3xl border border-white/60 bg-white/70 p-7 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Booking System</p>
          <h3 className="mt-2 font-heading text-4xl">Book Stitching / Design Service</h3>

          <form onSubmit={submitPublicBooking} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              Name
              <input
                type="text"
                value={publicBookingForm.name}
                onChange={(event) => setPublicBookingForm((prev) => ({ ...prev, name: event.target.value }))}
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium">
              Phone
              <input
                type="tel"
                value={publicBookingForm.phone}
                onChange={(event) => setPublicBookingForm((prev) => ({ ...prev, phone: event.target.value }))}
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium">
              Service Type
              <select
                value={publicBookingForm.serviceType}
                onChange={(event) => setPublicBookingForm((prev) => ({ ...prev, serviceType: event.target.value }))}
                className={inputClass}
                required
              >
                <option value="">Select service</option>
                {publicServices.map((service) => (
                  <option key={`public-book-${service.title}`} value={service.title}>
                    {service.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Date
              <input
                type="date"
                value={publicBookingForm.date}
                onChange={(event) => setPublicBookingForm((prev) => ({ ...prev, date: event.target.value }))}
                min={minPublicBookingDate}
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium md:col-span-2">
              Notes
              <textarea
                value={publicBookingForm.notes}
                onChange={(event) => setPublicBookingForm((prev) => ({ ...prev, notes: event.target.value }))}
                className={`${inputClass} min-h-24 resize-none`}
                placeholder="Any design preference, measurements, or event details"
              />
            </label>

            <div className="md:col-span-2">
              <button type="submit" className="btn-animated rounded-full bg-gold px-5 py-2 text-sm font-semibold text-cream">
                Submit Booking
              </button>
            </div>
          </form>

          {publicBookingError && <p className="mt-3 text-xs text-red-600">{publicBookingError}</p>}
          {publicBookingSuccess && <p className="mt-3 text-xs text-emerald-700">{publicBookingSuccess}</p>}
        </motion.section>
      </main>

      <a
        href="https://wa.me/917843016325?text=Hello%20Payal%20Fashion%20Designing%2C%20I%20want%20to%20book%20an%20appointment."
        target="_blank"
        rel="noreferrer"
        className="btn-animated fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-glow transition hover:scale-105"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={24} />
      </a>

      <a
        href="tel:7843016325"
        className="btn-animated fixed bottom-5 left-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose text-cream shadow-soft transition hover:scale-105 sm:hidden"
        aria-label="Call now"
      >
        <Phone size={22} />
      </a>

      {selectedGalleryItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedGalleryItem(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedGalleryItem(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-rose"
            >
              <X size={18} />
            </button>
            <img src={selectedGalleryItem.image} alt={selectedGalleryItem.title} className="max-h-[75vh] w-full object-cover" />
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{selectedGalleryItem.category}</p>
              <h4 className="mt-1 font-heading text-3xl text-rose">{selectedGalleryItem.title}</h4>
            </div>
          </motion.div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAdminModal(false)}>
          <motion.form
            onSubmit={handleLogin}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-7 shadow-soft backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h1 className="font-heading text-3xl text-rose">Admin Login</h1>
              <button type="button" onClick={() => setShowAdminModal(false)} className="rounded-full p-1 text-rose/70 hover:bg-rose/10">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-rose/80">Secure access for customer, order, and billing modules.</p>

            {!isFirebaseConfigured && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Firebase config missing. Add credentials in `.env` and restart server.
              </p>
            )}

            <label className="mt-4 block text-sm font-medium text-rose/90">
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                className={inputClass}
                required
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-rose/90">
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                className={inputClass}
                required
              />
            </label>

            <button
              type="submit"
              disabled={!isFirebaseConfigured || authLoading}
              className="btn-animated mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-cream shadow-soft transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock size={15} />
              {authLoading ? 'Checking Session...' : 'Login'}
            </button>

            {loginError && <p className="mt-3 text-xs text-red-600">{loginError}</p>}
          </motion.form>
        </div>
      )}
    </motion.div>
  )
}

export default App
