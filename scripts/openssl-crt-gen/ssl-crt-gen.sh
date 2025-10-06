# Generate private key
openssl genrsa -out hyperflex-tool.key 2048

# Generate certificate signing request (CSR)
openssl req -new -key hyperflex-tool.key -out hyperflex-tool.csr -config openssl.cnf

# Generate self-signed cert (valid 10 years)
openssl x509 -req -in hyperflex-tool.csr -signkey hyperflex-tool.key -out hyperflex-tool.crt \
  -days 3650 -extensions req_ext -extfile openssl.cnf


openssl pkcs12 -export \
  -in hyperflex-tool.crt \
  -inkey hyperflex-tool.key \
  -out keystore.p12 \
  -name hyperflex \
  -CAfile hyperflex-tool.crt \
  -caname root
