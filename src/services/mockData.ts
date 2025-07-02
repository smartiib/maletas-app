// Mock data para desenvolvimento sem WooCommerce configurado

export const mockProducts = [
  {
    id: 1,
    name: 'Camiseta Básica',
    type: 'simple',
    sku: 'CAM001',
    price: '29.90',
    regular_price: '39.90',
    sale_price: '29.90',
    stock_quantity: 15,
    stock_status: 'instock',
    status: 'publish',
    categories: [{ id: 1, name: 'Roupas' }],
    images: []
  },
  {
    id: 2,
    name: 'Tênis Esportivo',
    type: 'variable',
    sku: 'TEN001',
    price: '89.90',
    regular_price: '119.90',
    sale_price: '89.90',
    stock_quantity: null, // Variável usa variações
    stock_status: 'instock',
    status: 'publish',
    categories: [{ id: 2, name: 'Calçados' }],
    images: [],
    variations: [
      {
        id: 101,
        sku: 'TEN001-38',
        price: '89.90',
        stock_quantity: 5,
        stock_status: 'instock',
        attributes: [{ name: 'Tamanho', option: '38' }]
      },
      {
        id: 102,
        sku: 'TEN001-39',
        price: '89.90',
        stock_quantity: 3,
        stock_status: 'instock',
        attributes: [{ name: 'Tamanho', option: '39' }]
      }
    ]
  }
];

export const mockOrders = [
  {
    id: 1,
    number: '1001',
    status: 'processing',
    total: '119.80',
    currency: 'R$',
    date_created: new Date().toISOString(),
    billing: {
      first_name: 'João',
      last_name: 'Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999'
    },
    line_items: [
      { id: 1, name: 'Camiseta Básica', quantity: 2, total: '59.80' }
    ],
    payment_method_title: 'PIX'
  }
];

export const mockCustomers = [
  {
    id: 1,
    first_name: 'João',
    last_name: 'Silva',
    email: 'joao@email.com',
    date_created: new Date().toISOString(),
    orders_count: 3,
    total_spent: '350.50',
    billing: {
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 99999-9999',
      postcode: '01000-000'
    },
    meta_data: [
      { key: 'birth_date', value: '1990-05-15' }
    ]
  }
];