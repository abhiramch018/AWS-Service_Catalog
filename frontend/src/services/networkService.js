import api from './api';

export async function fetchVpcs() {
  const response = await api.get('/api/aws/vpcs');
  return response.data;
}

export async function fetchSubnets(vpcId) {
  const response = await api.get('/api/aws/subnets', { params: { vpcId } });
  return response.data;
}
