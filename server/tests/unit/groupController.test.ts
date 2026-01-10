import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import {
  createGroup,
  getGroupMembers,
  submitJoinRequest,
  cancelJoinRequest,
  getGroupDetails,
  leaveGroup,
  getSentJoinRequests,
  getReceivedJoinRequests,
  searchGroups,
  acceptJoinRequest,
  rejectJoinRequest,
  suggestGroups,
  removeMember,
  updateGroup,
} from '../../controllers/groupController';
import * as groupService from '../../service/groupService';

jest.mock('../../service/groupService');

describe('Group Controller Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockRes = { status: statusMock as any, json: jsonMock as any };
    mockReq = { user: { id: 'user-123' }, body: {}, params: {} };
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create group successfully', async () => {
      mockReq.body = { name: 'Test Group', description: 'Desc', category: 'Tech' };
      (groupService.createGroupService as any).mockResolvedValue({ id: 'group-123' });

      await createGroup(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group created successfully' }));
    });

    it('should use default cover image', async () => {
      mockReq.body = { name: 'Test', description: 'Desc', category: 'General' };
      mockReq.file = undefined;
      (groupService.createGroupService as any).mockResolvedValue({ id: 'group-456' });

      await createGroup(mockReq as Request, mockRes as Response);

      expect(groupService.createGroupService).toHaveBeenCalledWith('user-123',
        expect.objectContaining({ cover_image: '/uploads/groups/group.jpg' }));
    });

    it('should reject unauthenticated request', async () => {
      mockReq.user = undefined;
      await createGroup(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should reject missing required fields', async () => {
      mockReq.body = { name: 'Test' };
      await createGroup(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject whitespace-only name', async () => {
      mockReq.body = { name: '   ', description: 'Desc', category: 'General' };
      await createGroup(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('getGroupMembers', () => {
    it('should fetch members successfully', async () => {
      mockReq.params = { id: 'group-123' };
      (groupService.getGroupMembersService as any).mockResolvedValue([{ id: 'user-1' }]);

      await getGroupMembers(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('submitJoinRequest', () => {
    it('should submit join request successfully', async () => {
      mockReq.params = { id: 'group-123' };
      (groupService.submitJoinRequestService as any).mockResolvedValue({ request: { id: 'req-123' } });

      await submitJoinRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should reject unauthenticated request', async () => {
      mockReq.user = undefined;
      await submitJoinRequest(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('cancelJoinRequest', () => {
    it('should cancel join request successfully', async () => {
      mockReq.params = { requestId: 'req-123' };
      (groupService.cancelJoinRequestService as any).mockResolvedValue(undefined);

      await cancelJoinRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should reject unauthenticated request', async () => {
      mockReq.user = undefined;
      await cancelJoinRequest(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe("getGroupDetails", () => {
    it("should get group details successfully", async () => {
      mockReq.params = { id: "group-123" };
      mockReq.user = { id: "user-123" };
      const mockGroup = { id: "group-123", name: "Test Group", memberCount: 50 };
      (groupService.getGroupDetailsService as any).mockResolvedValue(mockGroup);

      await getGroupDetails(mockReq as Request, mockRes as Response);

      expect(groupService.getGroupDetailsService).toHaveBeenCalledWith("group-123", "user-123");
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockGroup);
    });
  });

  describe("leaveGroup", () => {
    it("should leave group successfully", async () => {
      mockReq.params = { id: "group-123" };
      mockReq.user = { id: "user-123" };
      const mockUpdatedGroup = { id: "group-123", name: "Test Group" };
      (groupService.leaveGroupService as any).mockResolvedValue(mockUpdatedGroup);

      await leaveGroup(mockReq as Request, mockRes as Response);

      expect(groupService.leaveGroupService).toHaveBeenCalledWith("user-123", "group-123");
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Left group successfully",
        group: mockUpdatedGroup
      });
    });
  });

  describe('createGroup - validation branches', () => {
    it('should reject when name is empty', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { name: '  ', description: 'Valid description', category: 'Tech' };

      await createGroup(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Name, description, and category are required' });
    });

    it('should reject when description is empty', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { name: 'Valid Name', description: '', category: 'Tech' };

      await createGroup(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Name, description, and category are required' });
    });

    it('should reject when category is missing', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { name: 'Valid Name', description: 'Valid description' };

      await createGroup(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Name, description, and category are required' });
    });

    it('should use default cover image when no file provided', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { name: 'Test Group', description: 'Description', category: 'Tech' };
      mockReq.file = undefined;
      (groupService.createGroupService as any).mockResolvedValue({ id: 'group-1', name: 'Test Group' });

      await createGroup(mockReq as Request, mockRes as Response);

      expect(groupService.createGroupService).toHaveBeenCalledWith('user-123', expect.objectContaining({
        cover_image: '/uploads/groups/group.jpg'
      }));
    });

    it('should use uploaded file as cover image', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { name: 'Test Group', description: 'Description', category: 'Tech' };
      mockReq.file = { filename: 'custom.jpg' } as any;
      (groupService.createGroupService as any).mockResolvedValue({ id: 'group-1', name: 'Test Group' });

      await createGroup(mockReq as Request, mockRes as Response);

      expect(groupService.createGroupService).toHaveBeenCalledWith('user-123', expect.objectContaining({
        cover_image: '/uploads/groups/custom.jpg'
      }));
    });
  });

  describe('submitJoinRequest - unauthorized branch', () => {
    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'group-123' };

      await submitJoinRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized: No user ID found' });
    });
  });

  describe('cancelJoinRequest - unauthorized branch', () => {
    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { requestId: 'request-123' };

      await cancelJoinRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('getSentJoinRequests', () => {
    it('should get sent requests successfully', async () => {
      mockReq.user = { id: 'user-123' };
      const mockRequests = [{ id: 'req-1', group: 'group-1' }];
      (groupService.getSentJoinRequestService as any).mockResolvedValue(mockRequests);

      await getSentJoinRequests(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Sent requests fetched', requests: mockRequests });
    });

    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;

      await getSentJoinRequests(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('getReceivedJoinRequests', () => {
    it('should get received requests successfully', async () => {
      mockReq.user = { id: 'user-123' };
      const mockRequests = [{ id: 'req-1', user: 'user-2' }];
      (groupService.getReceivedJoinRequestService as any).mockResolvedValue(mockRequests);

      await getReceivedJoinRequests(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Received requests fetched', requests: mockRequests });
    });

    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;

      await getReceivedJoinRequests(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('searchGroups', () => {
    it('should search groups successfully', async () => {
      mockReq.query = { query: 'tech' };
      const mockGroups = [{ id: 'group-1', name: 'Tech Group' }];
      (groupService.searchGroupsService as any).mockResolvedValue(mockGroups);

      await searchGroups(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Groups fetched', groups: mockGroups });
    });

    it('should reject short query', async () => {
      mockReq.query = { query: 'a' };

      await searchGroups(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Search query must be at least 2 characters long' });
    });

    it('should handle empty query', async () => {
      mockReq.query = { query: '  ' };

      await searchGroups(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('acceptJoinRequest', () => {
    it('should accept request successfully', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { requestId: 'req-1' };
      const mockGroup = { id: 'group-1', name: 'Test Group' };
      (groupService.acceptJoinRequestService as any).mockResolvedValue(mockGroup);

      await acceptJoinRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Join request approved', group: mockGroup });
    });

    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { requestId: 'req-1' };

      await acceptJoinRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('rejectJoinRequest', () => {
    it('should reject request successfully', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { requestId: 'req-1' };
      const mockGroup = { id: 'group-1', name: 'Test Group' };
      (groupService.rejectJoinRequestService as any).mockResolvedValue(mockGroup);

      await rejectJoinRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Join request rejected', group: mockGroup });
    });

    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { requestId: 'req-1' };

      await rejectJoinRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('suggestGroups', () => {
    it('should suggest groups successfully', async () => {
      mockReq.user = { id: 'user-123' };
      const mockGroups = [{ id: 'group-1' }, { id: 'group-2' }];
      (groupService.suggestGroupsService as any).mockResolvedValue(mockGroups);

      await suggestGroups(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Suggested groups fetched', groups: mockGroups });
    });

    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;

      await suggestGroups(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      mockReq.user = { id: 'admin-123' };
      mockReq.params = { groupId: 'group-1', memberId: 'member-1' };
      (groupService.removeMemberService as any).mockResolvedValue(undefined);

      await removeMember(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Member removed successfully' });
    });

    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { groupId: 'group-1', memberId: 'member-1' };

      await removeMember(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { groupId: 'group-1' };
      mockReq.body = { name: 'Updated Name' };
      const mockGroup = { id: 'group-1', name: 'Updated Name' };
      (groupService.updateGroupService as any).mockResolvedValue(mockGroup);

      await updateGroup(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Group updated successfully', group: mockGroup });
    });

    it('should reject when user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { groupId: 'group-1' };
      mockReq.body = { name: 'Updated' };

      await updateGroup(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should reject when no updates provided', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { groupId: 'group-1' };
      mockReq.body = {};

      await updateGroup(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No updates provided' });
    });

    it('should reject when group not found', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { groupId: 'group-1' };
      mockReq.body = { name: 'Updated' };
      (groupService.updateGroupService as any).mockResolvedValue(null);

      await updateGroup(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Group not found' });
    });
  });
});
