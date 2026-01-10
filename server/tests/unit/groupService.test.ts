import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createGroupService,
  submitJoinRequestService,
  acceptJoinRequestService,
  rejectJoinRequestService,
  leaveGroupService,
  getGroupDetailsService,
  updateGroupService,
  cancelJoinRequestService,
  searchGroupsService,
  getGroupMembersService,
  suggestGroupsService,
} from '../../service/groupService';
import { session, driver } from '../../db/neo4j';

jest.mock('../../db/neo4j', () => ({
  session: {
    run: jest.fn(),
    close: jest.fn(),
  },
  driver: {
    session: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('Group Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroupService', () => {
    it('should create a group with creator as admin', async () => {
      const mockGroup = {
        id: 'group-mock-uuid-123',
        name: 'Tech Enthusiasts',
        description: 'A group for tech lovers',
        category: 'Technology',
        member_count: 1,
        is_active: true,
      };

      (session.run as any).mockResolvedValueOnce({
        records: [{ get: () => ({ properties: mockGroup }) }],
      });

      const result = await createGroupService('user123', {
        name: 'Tech Enthusiasts',
        description: 'A group for tech lovers',
        category: 'Technology',
      });

      expect(result.name).toBe('Tech Enthusiasts');
      expect(result.member_count).toBe(1);
      expect(session.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (g:Group'),
        expect.objectContaining({
          creatorId: 'user123',
          name: 'Tech Enthusiasts',
          category: 'Technology',
        })
      );
    });

    it('should create group with admin and member relationships', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        description: 'Test',
        category: 'General',
      };

      (session.run as any).mockResolvedValueOnce({
        records: [{ get: () => ({ properties: mockGroup }) }],
      });

      await createGroupService('user123', {
        name: 'Test Group',
        description: 'Test',
        category: 'General',
      });

      expect(session.run).toHaveBeenCalledWith(
        expect.stringContaining('ADMIN_OF'),
        expect.any(Object)
      );
      expect(session.run).toHaveBeenCalledWith(
        expect.stringContaining('MEMBER_OF'),
        expect.any(Object)
      );
    });
  });

  describe('submitJoinRequestService', () => {
    it('should create join request for existing group', async () => {
      (session.run as any)
        .mockResolvedValueOnce({
          records: [{ get: () => ({ properties: { id: 'group123' } }) }],
        })
        .mockResolvedValueOnce({
          records: [
            {
              get: () => ({
                properties: {
                  id: 'join-req-mock-uuid-123',
                  status: 'pending',
                },
              }),
            },
          ],
        });

      const result = await submitJoinRequestService('user123', 'group123');

      expect(result.request.status).toBe('pending');
      expect(session.run).toHaveBeenCalledTimes(2);
    });

    it('should throw error for non-existent group', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [],
      });

      await expect(submitJoinRequestService('user123', 'nonexistent-group')).rejects.toThrow(
        'Group not found'
      );
    });
  });

  describe('acceptJoinRequestService', () => {
    it('should accept join request and add user as member', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [
          {
            get: () => ({
              properties: {
                id: 'group123',
                name: 'Tech Group',
              },
            }),
          },
        ],
      });

      const result = await acceptJoinRequestService('admin123', 'request123');

      expect(result.id).toBe('group123');
      expect(session.run).toHaveBeenCalledWith(
        expect.stringContaining('MEMBER_OF'),
        expect.objectContaining({
          reviewerId: 'admin123',
          requestId: 'request123',
        })
      );
    });
  });

  describe('rejectJoinRequestService', () => {
    it('should reject join request', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [
          {
            get: () => ({
              properties: {
                id: 'group123',
                name: 'Tech Group',
              },
            }),
          },
        ],
      });

      const result = await rejectJoinRequestService('admin123', 'request123');

      expect(result.id).toBe('group123');
      expect(session.run).toHaveBeenCalledWith(
        expect.stringContaining('rejected'),
        expect.objectContaining({
          reviewerId: 'admin123',
          requestId: 'request123',
        })
      );
    });
  });

  describe('leaveGroupService', () => {
    it('should allow member to leave group', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [
          {
            get: () => ({
              properties: {
                id: 'group123',
                name: 'Tech Group',
                member_count: 9,
              },
            }),
          },
        ],
      });

      const result = await leaveGroupService('user123', 'group123');

      expect(result.id).toBe('group123');
      expect(result.member_count).toBe(9);
      expect(session.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE r'),
        expect.objectContaining({
          userId: 'user123',
          groupId: 'group123',
        })
      );
    });

    it('should throw error when user is not a member', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [],
      });

      await expect(leaveGroupService('user123', 'group123')).rejects.toThrow(
        'User is not a member of this group or group not found'
      );
    });
  });

  describe('getGroupDetailsService', () => {
    it('should return group details with membership status', async () => {
      const mockGroup = {
        id: 'group123',
        name: 'Tech Group',
        description: 'Tech discussions',
        member_count: 50,
      };

      const mockSession = {
        run: jest.fn().mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'g') return { properties: mockGroup };
                if (key === 'members') return [];
                if (key === 'postsWithAuthors') return [];
                if (key === 'isAdmin') return false;
                if (key === 'isMember') return true;
                if (key === 'hasRequested') return false;
                if (key === 'memberCount') return { toNumber: () => 50 };
                if (key === 'friendCount') return { toNumber: () => 5 };
                if (key === 'joinRequestId') return null;
                return null;
              },
              has: () => false,
            },
          ],
        } as never),
        close: jest.fn(),
      };

      (driver.session as jest.Mock).mockReturnValueOnce(mockSession);

      const result = await getGroupDetailsService('group123', 'user123');

      expect(result.group.id).toBe('group123');
      expect(result.group.name).toBe('Tech Group');
      expect(result.isMember).toBe(true);
      expect(result.isAdmin).toBe(false);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          groupId: 'group123',
          userId: 'user123',
        })
      );
    });
  });

  describe('updateGroupService', () => {
    it('should update group details by admin', async () => {
      const updatedGroup = {
        id: 'group123',
        name: 'Updated Group Name',
        description: 'Updated description',
      };

      const mockSession: any = {
        run: (jest.fn() as any).mockResolvedValueOnce({
          records: [{ get: () => ({ properties: updatedGroup }) }],
        }),
        close: jest.fn(),
      };

      (driver.session as any).mockReturnValueOnce(mockSession);

      const result = await updateGroupService('group123', 'admin123', {
        name: 'Updated Group Name',
        description: 'Updated description',
      });

      expect(result.name).toBe('Updated Group Name');
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('SET g.name = $name'),
        expect.objectContaining({
          groupId: 'group123',
          userId: 'admin123',
        })
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should return null when non-admin tries to update', async () => {
      const mockSession: any = {
        run: (jest.fn() as any).mockResolvedValueOnce({
          records: [],
        }),
        close: jest.fn(),
      };

      (driver.session as any).mockReturnValueOnce(mockSession);

      const result = await updateGroupService('group123', 'user123', {
        name: 'Trying to update',
      });

      expect(result).toBeNull();
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('cancelJoinRequestService', () => {
    it('should cancel join request successfully', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [{ get: () => ({ properties: { id: 'request123' } }) }],
      });

      const result = await cancelJoinRequestService('user123', 'request123');

      expect(result).toHaveProperty('success', true);
      expect(session.run).toHaveBeenCalledWith(
        expect.stringContaining('DETACH DELETE r'),
        { userId: 'user123', requestId: 'request123' }
      );
    });

    it('should throw error when request not found', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [],
      });

      await expect(cancelJoinRequestService('user123', 'nonexistent-request')).rejects.toThrow(
        'Request not found or not owned by user'
      );
    });

    it('should throw error when user does not own the request', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [],
      });

      await expect(cancelJoinRequestService('user123', 'other-user-request')).rejects.toThrow(
        'Request not found or not owned by user'
      );
    });
  });

  describe('searchGroupsService', () => {
    it('should search groups by query', async () => {
      const mockGroup = {
        id: 'group1',
        name: 'Tech Enthusiasts',
        description: 'For tech lovers',
        category: 'Technology',
        member_count: 50,
      };

      (session.run as any).mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'g') return { properties: mockGroup };
              if (key === 'memberCount') return { toNumber: () => 50 };
            },
          },
        ],
      });

      const result = await searchGroupsService('tech');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', 'Tech Enthusiasts');
      expect(result[0]).toHaveProperty('member_count', 50);
    });

    it('should return empty array when no groups match', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [],
      });

      const result = await searchGroupsService('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('getGroupMembersService', () => {
    it('should return group members with membership info', async () => {
      const mockMember = {
        id: 'user1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
      };

      const mockMembership = {
        role: 'admin',
        joined_at: new Date(),
      };

      (session.run as any).mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'u') return { properties: mockMember };
              if (key === 'm') return { properties: mockMembership };
            },
          },
        ],
      });

      const result = await getGroupMembersService('group123');

      expect(result).toHaveLength(1);
      expect(result[0].user).toHaveProperty('first_name', 'John');
      expect(result[0].membership).toHaveProperty('role', 'admin');
    });

    it('should return empty array when group has no members', async () => {
      (session.run as any).mockResolvedValueOnce({
        records: [],
      });

      const result = await getGroupMembersService('empty-group');

      expect(result).toHaveLength(0);
    });
  });

  describe('suggestGroupsService', () => {
    it('should return suggested groups based on friend memberships', async () => {
      const mockGroup = {
        id: 'group1',
        name: 'Test Group',
        description: 'A test group',
        member_count: { toNumber: () => 10 },
      };

      (session.run as any)
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'g') return { properties: mockGroup };
                if (key === 'friendCount') return { toNumber: () => 3 };
                if (key === 'memberCount') return { toNumber: () => 10 };
                return null;
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          // Mock filler query (empty result)
          records: [],
        });

      const result = await suggestGroupsService('user1', 20);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'group1');
      expect(result[0]).toHaveProperty('friend_count', 3);
      expect(result[0]).toHaveProperty('member_count', 10);
    });

    it('should add filler groups when suggested groups are less than limit', async () => {
      const mockSuggestedGroup = {
        id: 'group1',
        name: 'Suggested Group',
        member_count: { toNumber: () => 5 },
      };

      const mockFillerGroup = {
        id: 'group2',
        name: 'Filler Group',
        member_count: { toNumber: () => 15 },
      };

      (session.run as any)
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'g') return { properties: mockSuggestedGroup };
                if (key === 'friendCount') return { toNumber: () => 2 };
                if (key === 'memberCount') return { toNumber: () => 5 };
                return null;
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'g') return { properties: mockFillerGroup };
                if (key === 'memberCount') return { toNumber: () => 15 };
                return null;
              },
            },
          ],
        });

      const result = await suggestGroupsService('user1', 5);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'group1');
      expect(result[0]).toHaveProperty('friend_count', 2);
      expect(result[1]).toHaveProperty('id', 'group2');
      expect(result[1]).toHaveProperty('friend_count', 0);
      expect(result[1]).toHaveProperty('member_count', 15);
    });

    it('should not add filler when suggested groups meet the limit', async () => {
      const mockGroups = [
        { id: 'group1', name: 'Group 1', member_count: { toNumber: () => 10 } },
        { id: 'group2', name: 'Group 2', member_count: { toNumber: () => 8 } },
      ];

      (session.run as any)
        .mockResolvedValueOnce({
          records: mockGroups.map((group, idx) => ({
            get: (key: string) => {
              if (key === 'g') return { properties: group };
              if (key === 'friendCount') return { toNumber: () => idx + 1 };
              if (key === 'memberCount') return group.member_count;
              return null;
            },
          })),
        });

      const result = await suggestGroupsService('user1', 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'group1');
      expect(result[1]).toHaveProperty('id', 'group2');
      expect(session.run).toHaveBeenCalledTimes(1); // Only first query, no filler
    });

    it('should handle memberCount toNumber function correctly', async () => {
      const mockGroup = {
        id: 'group3',
        name: 'Group with number conversion',
        member_count: { toNumber: () => 20 },
      };

      (session.run as any)
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'g') return { properties: mockGroup };
                if (key === 'friendCount') return { toNumber: () => 1 };
                if (key === 'memberCount') return { toNumber: () => 20 };
                return null;
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          records: [], // Filler query result
        });

      const result = await suggestGroupsService('user1', 10);

      expect(result[0]).toHaveProperty('member_count', 20);
    });

    it('should handle filler groups without toNumber function', async () => {
      const mockSuggestedGroup = {
        id: 'group1',
        name: 'Suggested',
        member_count: { toNumber: () => 3 },
      };

      const mockFillerGroup = {
        id: 'group2',
        name: 'Filler',
        member_count: 10, // Plain number
      };

      (session.run as any)
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'g') return { properties: mockSuggestedGroup };
                if (key === 'friendCount') return { toNumber: () => 1 };
                if (key === 'memberCount') return { toNumber: () => 3 };
                return null;
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'g') return { properties: mockFillerGroup };
                if (key === 'memberCount') return null;
                return null;
              },
            },
          ],
        });

      const result = await suggestGroupsService('user1', 5);

      expect(result).toHaveLength(2);
      expect(result[1]).toHaveProperty('member_count', 0); // Falls back to 0
    });
  });
});
